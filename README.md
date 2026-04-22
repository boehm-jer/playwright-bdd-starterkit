# Playwright BDD Starter Kit

A starter kit for end-to-end testing using [Playwright](https://playwright.dev) and [Cucumber BDD](https://cucumber.io/docs/bdd/) via [playwright-bdd](https://github.com/vitalets/playwright-bdd). Tests are written as human-readable `.feature` files and backed by typed TypeScript automation.

## Included examples

> | Feature            | Demonstrates                                                |
> | ------------------ | ----------------------------------------------------------- |
> | `sample`           | Basic navigation and title assertion                        |
> | `accessibility`    | Axe-core accessibility scanning with impact-level filtering |
> | `pdfDownload`      | File downloads and PDF content validation                   |
> | `submit`           | Form interaction and submission confirmation                |
> | `visualRegression` | Full-page screenshot comparison against a stored baseline   |

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
features/       # Gherkin .feature files — one folder per feature
steps/          # Cucumber step definitions — map Gherkin steps to DSL calls
dsl/            # Domain logic — typed classes that wrap Playwright interactions
helpers/        # Low-level utilities (PDF parsing, accessibility filters, types)
fixtures.ts     # Playwright fixtures — wires DSL classes into the test context
playwright.config.ts
```

### How the layers connect

```
.feature file  →  step definition  →  DSL method  →  Playwright API
```

- **Feature files** describe behavior in plain English.
- **Step definitions** are often thin (especially for the "Given" step). Each step typically calls one DSL method. The DSL methods should be as reusable as possible. That will mean that sometimes the step definitions call more than one DSL method. As a general rule, there should probably no more than five DSL methods per step definition.
- **DSL classes** contain all Playwright interaction logic and are the right place to add new automation.
- **Helpers** are stateless utilities shared across DSL classes.

- **Fixtures** (`fixtures.ts`) create one DSL instance per scenario and inject it into all steps in that scenario via `createBdd(test)`. This means `Given`, `When`, and `Then` steps share the same object, so state (e.g. a downloaded filename) can be stored on the DSL instance and read by a later step.

---

## Adding a new feature

1. Create `features/<name>/<name>.feature` with a `@<name>` tag and your scenarios
2. Create `dsl/<name>Dsl.ts` with a class containing the Playwright interactions
3. Register the fixture in `fixtures.ts`:
   ```typescript
   myDsl: async ({ page }, use) => {
     await use(new MyDsl(page));
   };
   ```
4. Create `steps/<name>Steps.ts` using `createBdd(test)` and map each step to a DSL method

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

`VisualRegressionHelpers.compareScreenshot` accepts an optional options object:

| Option              | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `maxDiffPixelRatio` | `0.01`  | Maximum fraction of pixels that may differ (0–1)     |
| `threshold`         | `0.2`   | Per-pixel color difference tolerance (0–1)           |
| `mask`              | `[]`    | CSS selectors for regions to exclude from comparison |

Pass options from the DSL when calling the helper:

```typescript
await VisualRegressionHelpers.compareScreenshot(
  this.page,
  this.pendingScreenshotName,
  {
    maxDiffPixelRatio: 0.05,
    mask: ["[data-testid='timestamp']"],
  },
);
```

---
