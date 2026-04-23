# Playwright BDD Starter Kit

A starter kit for end-to-end testing using [Playwright](https://playwright.dev) and [Cucumber BDD](https://cucumber.io/docs/bdd/) via [playwright-bdd](https://github.com/vitalets/playwright-bdd). Tests are written as human-readable `.feature` files and backed by typed TypeScript automation. The architecture is designed to be driver-agnostic — switching from Playwright to another browser driver (Cypress, WebdriverIO) requires writing exactly one new class.

## Included examples

| Feature            | Demonstrates                                                |
| ------------------ | ----------------------------------------------------------- |
| `sample`           | Basic navigation and title assertion                        |
| `accessibility`    | Axe-core accessibility scanning with impact-level filtering |
| `pdfDownload`      | File downloads and PDF content validation                   |
| `submit`           | Form interaction and submission confirmation                |
| `visualRegression` | Full-page screenshot comparison against a stored baseline   |

---

## Prerequisites

- Node.js `>=20.16.0`

---

## Setup

```bash
npm install
npx playwright install
npm run setup-hooks
```

`setup-hooks` installs a pre-commit git hook that prevents committing an `@only` tag — see [Tags](#tags) for why that matters.

---

## Running tests

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run test`      | Run all tests in the terminal                |
| `npm run ui`        | Open Playwright's interactive UI             |
| `npm run report`    | Open the HTML report from the last run       |
| `npm run tags-test` | Prompt for a tag and run only matching tests |

---

## Project structure

```
features/               # Gherkin .feature files — one folder per feature
steps/                  # Step definitions — map Gherkin steps to DSL calls
dsl/                    # Feature DSLs — driver-agnostic business logic
  base/                 # Abstract base classes (BaseDsl, BrowserDsl)
adapters/               # Driver implementations
  playwright/           # Playwright adapter — one file for the generic driver, one per exception feature
  cypress/              # Placeholder for a future Cypress adapter
context/                # ScenarioContext — DI container wiring DSL instances together
support/                # Framework shims: bdd.ts (Given/When/Then), selector.ts (by helper)
helpers/                # Stateless utilities (PDF parsing, accessibility filters, screenshot comparison)
config/                 # Placeholder for environment/driver configuration
setup/api/              # Placeholder for API-based test setup
fixtures.ts             # Playwright fixture — creates one ScenarioContext per scenario
playwright.config.ts
```

---

## Architecture

### Why it exists

A typical BDD project ties every feature directly to its browser driver. That's fine at 10 features. At 100 features, switching drivers means writing 100 new adapter classes. This project avoids that by separating the question "what should happen" (DSL) from "how to make it happen in this browser" (adapter).

### How it works

```
.feature  →  steps/  →  dsl/  →  adapters/  →  Browser
```

The key abstraction is `BrowserDsl` in `dsl/base/BrowserDsl.ts`. It defines the primitive operations any browser can perform: `click`, `fill`, `navigate`, `getText`, `isVisible`, etc. Feature DSLs are concrete classes that take a `BrowserDsl` instance in their constructor and express business logic entirely through those primitives:

```typescript
// dsl/sampleDsl.ts — knows nothing about Playwright
export class SampleDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async clickLink(name: string): Promise<void> {
    await this.browser.clickAndNavigate(by.role("link", { name }));
  }
}
```

The `by` helper in `support/selector.ts` builds typed `Selector` values (`by.role(...)`, `by.label(...)`, `by.text(...)`, etc.) so selector intent stays readable without leaking driver syntax into the DSL or step layers.

The Playwright adapter (`adapters/playwright/PlaywrightBrowserDsl.ts`) is the only file that knows how to translate a `Selector` into a Playwright `Locator`. To add a Cypress driver, you write one `CypressBrowserDsl` class that implements `BrowserDsl`. Every driver-agnostic feature test works immediately — no changes needed anywhere else.

`ScenarioContext` (`context/ScenarioContext.ts`) is a lightweight DI container. It holds all DSL instances for a scenario and is created once per test by the factory in `adapters/playwright/index.ts`. The fixture in `fixtures.ts` injects it into every step as `{ scenario }`.

### Exception cases

Three features cannot be expressed through the generic `BrowserDsl` primitives and still require a per-driver adapter class:

| Feature            | Why it needs a driver-specific adapter                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `accessibility`    | Axe-core is injected into the page via `page.evaluate` — a Playwright-specific API              |
| `pdfDownload`      | Detecting a file download requires listening to browser download events (`page.on(...)`)        |
| `visualRegression` | Screenshot capture and pixel-diff comparison use Playwright's `expect(page).toHaveScreenshot()` |

For these, the DSL file (`dsl/accessibilityDsl.ts`, etc.) defines an abstract class with the feature-specific methods, and `adapters/playwright/Playwright<Name>Dsl.ts` provides the concrete implementation. Adding a second driver for these features means writing one new adapter class per exception feature.

---

## Adding a new feature

### Standard feature (driver-agnostic)

Most features only need the browser primitives and can be implemented without any knowledge of Playwright.

1. Create `features/<name>/<name>.feature` with a `@<name>` tag and your scenarios
2. Create `dsl/<name>Dsl.ts` — a plain class that takes `BrowserDsl` in its constructor:

   ```typescript
   import { BrowserDsl } from "./base/BrowserDsl";
   import { by } from "../support/selector";

   export class MyDsl {
     constructor(private readonly browser: BrowserDsl) {}

     async doSomething(): Promise<void> {
       await this.browser.click(by.role("button", { name: "Submit" }));
     }
   }
   ```

3. Add the DSL to `context/ScenarioContext.ts`:
   ```typescript
   constructor(
     // existing fields...
     public readonly my: MyDsl,
   ) {}
   ```
4. Wire it into the factory in `adapters/playwright/index.ts`:
   ```typescript
   const browser = new PlaywrightBrowserDsl(page);
   return new ScenarioContext(
     // existing DSLs...
     new MyDsl(browser),
   );
   ```
5. Create `steps/<name>Steps.ts` using `{ scenario }` from `support/bdd.ts`

### Exception feature (driver-specific)

Use this path only when the feature needs APIs that `BrowserDsl` doesn't expose (download events, screenshot diffs, page injection, etc.).

1–2. Same as above, but make `dsl/<name>Dsl.ts` an abstract class extending `BrowserDsl`:

```typescript
import { BrowserDsl } from "./base/BrowserDsl";

export abstract class MySpecialDsl extends BrowserDsl {
  abstract doDriverSpecificThing(): Promise<void>;
}
```

3. Create `adapters/playwright/PlaywrightMySpecialDsl.ts` extending both `PlaywrightBrowserDsl` and implementing `MySpecialDsl`
   4–6. Same remaining steps as the standard path

---

## Tags

Tags filter which tests run. Every feature file should have a tag matching its folder name (e.g. `@accessibility`, `@submit`).

| Tag       | Purpose                                                          |
| --------- | ---------------------------------------------------------------- |
| `@<name>` | Identifies tests by feature — used with `npm run tags-test`      |
| `@only`   | Focuses a single test during development — **never commit this** |

> **Warning:** `@only` compiles to `test.only()`. If committed, `npm run test` will silently skip every other feature. The pre-commit hook installed by `npm run setup-hooks` will block commits that contain it.

---

## Visual regression

Visual regression tests capture a full-page screenshot and compare it to a stored baseline image. The test fails if the page has changed beyond a configurable pixel-difference tolerance.

### How it works

1. **First run** — no baseline exists yet, so Playwright writes one to `snapshots/` and the test fails with `"A snapshot doesn't exist … writing actual"`. This is expected.
2. **Second run** — the baseline exists and the screenshot is compared against it. The test passes if the difference is within tolerance.

Commit the files in `snapshots/` to source control so the baseline is shared across machines and CI.

### Updating baselines

When an intentional visual change is made, regenerate the baselines with:

```bash
npx playwright test --update-snapshots --grep @visualRegression
```

Review the updated images in `snapshots/` before committing them.

### Snapshot location

Snapshots are stored under `snapshots/` at the project root, namespaced by the generated spec path:

```
snapshots/
└── features/visualRegression/visualRegression.feature.spec.js-snapshots/
    └── example-homepage-darwin.png
```

The OS name is appended automatically because screenshots can differ between platforms. In CI, snapshots should be generated and compared on the same OS (e.g. always Linux).

### Configuring tolerance

`compareScreenshot` in `helpers/visualRegressionHelpers.ts` accepts an optional options object:

| Option              | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `maxDiffPixelRatio` | `0.01`  | Maximum fraction of pixels that may differ (0–1)     |
| `threshold`         | `0.2`   | Per-pixel color difference tolerance (0–1)           |
| `mask`              | `[]`    | CSS selectors for regions to exclude from comparison |
