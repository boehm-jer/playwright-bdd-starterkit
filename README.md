# Playwright BDD Starter Kit

A starter kit for end-to-end testing using [Playwright](https://playwright.dev) and [Cucumber BDD](https://cucumber.io/docs/bdd/) via [playwright-bdd](https://github.com/vitalets/playwright-bdd). Tests are written as human-readable `.feature` files and backed by typed TypeScript automation.

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

| Command | Description |
|---|---|
| `npm run test` | Run all tests in the terminal |
| `npm run ui` | Open Playwright's interactive UI |
| `npm run report` | Open the HTML report from the last run |
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

**Feature files** describe behaviour in plain English. **Step definitions** are thin — each step calls exactly one DSL method. **DSL classes** contain all Playwright interaction logic and are the right place to add new automation. **Helpers** are stateless utilities shared across DSL classes.

**Fixtures** (`fixtures.ts`) create one DSL instance per scenario and inject it into all steps in that scenario via `createBdd(test)`. This means `Given`, `When`, and `Then` steps share the same object, so state (e.g. a downloaded filename) can be stored on the DSL instance and read by a later step.

---

## Adding a new feature

1. Create `features/<name>/<name>.feature` with a `@<name>` tag and your scenarios
2. Create `dsl/<name>Dsl.ts` with a class containing the Playwright interactions
3. Register the fixture in `fixtures.ts`:
   ```typescript
   myDsl: async ({ page }, use) => {
     await use(new MyDsl(page));
   }
   ```
4. Create `steps/<name>Steps.ts` using `createBdd(test)` and map each step to a DSL method

---

## Tags

Tags filter which tests run. Every feature file should have a tag matching its folder name (e.g. `@accessibility`, `@submit`).

| Tag | Purpose |
|---|---|
| `@<name>` | Identifies tests by feature — used with `npm run tags-test` |
| `@only` | Focuses a single test during development — **never commit this** |

> **Warning:** `@only` compiles to `test.only()`. If committed, `npm run test` will silently skip every other feature. The pre-commit hook installed by `npm run setup-hooks` will block commits that contain it.

---

## Included examples

| Feature | Demonstrates |
|---|---|
| `sample` | Basic navigation and title assertion |
| `accessibility` | Axe-core accessibility scanning with impact-level filtering |
| `pdfDownload` | File downloads and PDF content validation |
| `submit` | Form interaction and submission confirmation |
