# Playwright BDD Starter Kit

A starter kit for end-to-end testing using [Playwright](https://playwright.dev) and [Cucumber BDD](https://cucumber.io/docs/bdd/) via [playwright-bdd](https://github.com/vitalets/playwright-bdd). Tests are written as human-readable `.feature` files and backed by typed TypeScript automation. The architecture is designed to be driver-agnostic — switching from Playwright to another browser driver (Cypress, WebdriverIO) requires writing exactly one new class.

## Table of contents

- [Included examples](#included-examples)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running tests](#running-tests)
- [Project structure](#project-structure)
- [Architecture](#architecture)
  - [Why it exists](#why-it-exists)
  - [How it works](#how-it-works)
  - [Exception cases](#exception-cases)
- [Adding a new feature](#adding-a-new-feature)
  - [Standard feature (driver-agnostic)](#standard-feature-driver-agnostic)
  - [Exception feature (driver-specific)](#exception-feature-driver-specific)
- [Feature file conventions](#feature-file-conventions)
- [Test layer conventions](#test-layer-conventions)
- [Claude skills](#claude-skills)
- [Advanced features](#advanced-features)
  - [Accessibility](#accessibility)
  - [PDF download](#pdf-download)
  - [Visual regression](#visual-regression)

---

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

Dependency versions are pinned **exactly** — no `^` or `~`. `playwright-bdd` reaches into
Playwright internals, and its declared peer range (`@playwright/test >=1.44`) is wider than what
actually works: a caret range can silently pull a newer Playwright that breaks `bddgen` outright.
Upgrade `@playwright/test` and `playwright-bdd` together, deliberately, as a tested pair.

`setup-hooks` installs a pre-commit git hook that prevents committing an `@only` tag — see [Tags](FEATURE_FILE_CONVENTIONS.md#tags) for why that matters.

Prettier is used for TypeScript and `.feature` files (via `prettier-plugin-gherkin`). Format the project with:

```bash
npx prettier --write .
```

---

## Running tests

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run test`      | Typecheck, then run all tests in the terminal |
| `npm run typecheck` | Typecheck only (`tsc --noEmit`)              |
| `npm run ui`        | Open Playwright's interactive UI             |
| `npm run report`    | Open the HTML report from the last run       |
| `npm run tags-test` | Prompt for a tag and run only matching tests |

---

`npm run test` typechecks first because `playwright test` transpiles without typechecking — a
type error in a file no scenario happens to exercise would otherwise never surface.

## Project structure

```
features/           dsl/            adapters/
steps/              context/        support/
helpers/            fixtures.ts     playwright.config.ts
```

See [Architecture](#architecture) for what each layer does. `config/` and `setup/api/` are empty placeholders for environment configuration and API-based test setup.

---

## Architecture

### Why it exists

A typical BDD project ties every feature directly to its browser driver. That's fine at 10 features. At 100 features, switching drivers means writing 100 new adapter classes. This project avoids that by separating the question "what should happen" (DSL) from "how to make it happen in this browser" (adapter).

### How it works

```
.feature  →  steps/  →  dsl/  →  adapters/  →  Browser
```

The key abstraction is `BrowserDsl` in `dsl/base/BrowserDsl.ts`. It defines the primitive operations any browser can perform: `click`, `fill`, `navigate`, `getText`, `isVisible`, `waitFor`, `getUncaughtErrors`, etc. Feature DSLs are concrete classes that take a `BrowserDsl` instance in their constructor and express business logic entirely through those primitives:

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

1. Create `features/<name>.feature` with a `@<name>` tag and your scenarios
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
   const browser = new PlaywrightBrowserDsl(page, testInfo);
   return new ScenarioContext(
     // existing DSLs...
     new MyDsl(browser),
   );
   ```
5. Create `steps/<name>Steps.ts` using `{ scenario }` from `support/bdd.ts`

### Exception feature (driver-specific)

Use this path only when the feature needs APIs that `BrowserDsl` doesn't expose (download events, screenshot diffs, page injection, etc.).

The key difference from the standard path is in step 2: the DSL must be an **abstract class** extending `BrowserDsl` rather than a plain class:

1. Create `features/<name>.feature` with a `@<name>` tag and your scenarios
2. Create `dsl/<name>Dsl.ts` as an abstract class extending `BrowserDsl`:

```typescript
import { BrowserDsl } from "./base/BrowserDsl";

export abstract class MySpecialDsl extends BrowserDsl {
  abstract doDriverSpecificThing(): Promise<void>;
}
```

3. Create `adapters/playwright/PlaywrightMySpecialDsl.ts` extending both `PlaywrightBrowserDsl` and implementing `MySpecialDsl`
   4–5. Same remaining steps as the standard path

---

## Feature file conventions

This project follows a specific "recipe" for writing Gherkin — one `Given` per scenario, strict `When`/`Then` alternation, a short list of legal scenario shapes, and tag conventions (including the `@only` guard). It's a recommendation distilled from experience, not a hard requirement.

**→ See [FEATURE_FILE_CONVENTIONS.md](FEATURE_FILE_CONVENTIONS.md) for the full recipe, worked examples, and the tag reference.**

---

## Test layer conventions

Every feature is exactly three files — a `.feature`, a dedicated step file, and a dedicated DSL —
named from one identifier. Step bodies contain nothing but DSL calls, and shared code has a home per
kind: browser primitives in `dsl/base/`, domain behaviour in `dsl/shared/<domain>/`, and app-wide
interactions in `helpers/`. These rules are what keep the driver swappable.

**→ See [TEST_LAYER_CONVENTIONS.md](TEST_LAYER_CONVENTIONS.md) for the full rules, worked examples for both the standard and exception paths, an anti-pattern table, and a completion checklist.**

---

## Claude skills

Two [Claude Code skills](https://code.claude.com/docs/en/skills) ship in `.claude/skills/`. They load
automatically for anyone running Claude Code in this repo, or in a project copied from it.

| Skill           | What it does                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `judgment-quiz` | Pins down business logic with a blinded quiz. Every decision the system makes, or should make, becomes a plain-language scenario, and the person accountable for the behavior answers without seeing what the system does today. The answers are compared with the code, the running site, its config, or other stakeholders. It works with or without unit tests, and before any code exists. |
| `feature-files` | Writes `.feature` files that follow [FEATURE_FILE_CONVENTIONS.md](FEATURE_FILE_CONVENTIONS.md), from quiz results, tickets or descriptions, and lints them.                                                                                                                                                                                                                                    |

They chain: the quiz's resolved answers become feature files, and those become the acceptance tests.
Ask Claude for either one by name, or describe the task ("help me pin down how publishing should work
for editors"). The linter also runs on its own:

```bash
node .claude/skills/feature-files/scripts/lint-features.mjs   # checks every features/**/*.feature
```

---

## Advanced features

Three features can't be expressed through the generic `BrowserDsl` primitives, so each ships its own driver-specific adapter class. See [Architecture → Exception cases](#exception-cases) for why they need one and how to add a second driver for them.

### Accessibility

Injects [axe-core](https://github.com/dequelabs/axe-core) into the page (via `page.evaluate`) and scans for accessibility violations, filtered by impact level (e.g. only `serious` and above). Implemented in `adapters/playwright/PlaywrightAccessibilityDsl.ts`.

### PDF download

Triggers a file download, captures it by listening to the browser's download events (`page.on(...)`), and validates the downloaded PDF's contents. Implemented in `adapters/playwright/PlaywrightPdfDownloadDsl.ts`.

### Visual regression

Visual regression tests capture a full-page screenshot and compare it to a stored baseline image. The test fails if the page has changed beyond a configurable pixel-difference tolerance.

#### How it works

1. **First run** — no baseline exists yet, so Playwright writes one to `snapshots/` and the test fails with `"A snapshot doesn't exist … writing actual"`. This is expected.
2. **Second run** — the baseline exists and the screenshot is compared against it. The test passes if the difference is within tolerance.

Commit the files in `snapshots/` to source control so the baseline is shared across machines and CI.

#### Updating baselines

When an intentional visual change is made, regenerate the baselines with:

```bash
npx playwright test --update-snapshots --grep @visualRegression
```

Review the updated images in `snapshots/` before committing them.

#### Snapshot location

Snapshots are stored under `snapshots/` at the project root, namespaced by the generated spec path:

```
snapshots/
└── features/visualRegression.feature.spec.js-snapshots/
    └── example-homepage-darwin.png
```

The OS name is appended automatically because screenshots can differ between platforms. In CI, snapshots should be generated and compared on the same OS (e.g. always Linux).

#### Configuring tolerance

`compareScreenshot` in `helpers/visualRegressionHelpers.ts` accepts an optional options object:

| Option              | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `maxDiffPixelRatio` | `0.01`  | Maximum fraction of pixels that may differ (0–1)     |
| `threshold`         | `0.2`   | Per-pixel color difference tolerance (0–1)           |
| `mask`              | `[]`    | CSS selectors for regions to exclude from comparison |
