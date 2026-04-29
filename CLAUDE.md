# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install && npx playwright install   # first-time setup
npm run setup-hooks                     # install @only pre-commit guard

npm run test        # bddgen + run all tests (headless)
npm run ui          # bddgen + open Playwright UI
npm run tags-test   # interactive: prompt for a tag, run matching tests only
npm run report      # open HTML report from the last run
```

To run a single feature directly:

```bash
./node_modules/.bin/bddgen --tags @<name> && ./node_modules/.bin/playwright test
```

**`bddgen` must always run before `playwright test`** — it compiles `.feature` files into spec files in `.features-gen/`. Skipping it means stale generated specs are used.

## Architecture

The project separates *what* a test does from *how the browser does it*, so switching drivers requires writing exactly one new class.

```
.feature  →  steps/  →  dsl/  →  adapters/  →  Browser
```

### Layers

| Layer | Location | Role |
|---|---|---|
| Feature files | `features/` | Gherkin scenarios — one folder per feature, tagged `@<name>` |
| Step definitions | `steps/` | Map Gherkin phrases to DSL method calls via `{ scenario }` |
| DSL classes | `dsl/` | Business logic — use only `BrowserDsl` primitives and `by.*` selectors |
| Adapter | `adapters/playwright/` | Translates `Selector` values to Playwright `Locator`s |
| DI container | `context/ScenarioContext.ts` | Holds all DSL instances for a scenario |
| Fixture | `fixtures.ts` | Creates one `ScenarioContext` per test via `createPlaywrightContext` |

### Key abstractions

**`BrowserDsl`** (`dsl/base/BrowserDsl.ts`) — abstract class defining every browser primitive (`click`, `fill`, `navigate`, `getText`, `isVisible`, etc.). Standard DSL classes take a `BrowserDsl` in their constructor and never import Playwright.

**`Selector` / `by`** (`support/selector.ts`) — typed discriminated union. Use `by.role(...)`, `by.label(...)`, `by.text(...)`, etc. in DSL code. `PlaywrightBrowserDsl.resolve()` is the only place that converts them to Playwright `Locator`s.

**`support/bdd.ts`** — re-exports `Given`/`When`/`Then` bound to the custom fixture. All step files import from here, not from `playwright-bdd` directly.

### Standard vs. exception features

**Standard** (driver-agnostic): DSL is a plain class taking `BrowserDsl`. Wire it by adding the DSL to `ScenarioContext` and the factory in `adapters/playwright/index.ts`.

**Exception** (driver-specific): DSL is an abstract class extending `BrowserDsl`. A `Playwright<Name>Dsl` in `adapters/playwright/` provides the concrete implementation. Currently: `accessibility` (axe-core via `page.evaluate`), `pdfDownload` (download events via `page.on`), and `visualRegression` (screenshot diff via `expect(page).toHaveScreenshot()`).

## Gherkin rules

- Each scenario has exactly one `Given` step — no `Background`, no `And` chaining
- Steps describe *intent*, not browser mechanics (e.g. "I submit the form", not "I click the submit button")
- Every feature file is tagged `@<featureName>` matching its folder name

## Tags

- `@<name>` — identifies a feature; used with `tags-test` to run a subset
- `@only` — focuses a single test (compiles to `test.only()`). **Never commit this.** The pre-commit hook installed by `setup-hooks` blocks commits that contain it.

## Visual regression

Snapshots live in `snapshots/` and are committed to source control. The first run against a new baseline writes the snapshot and *fails* — that is expected. Run a second time to compare.

Update baselines after an intentional visual change:

```bash
npx playwright test --update-snapshots --grep @visualRegression
```

Snapshots are OS-specific (filename includes `darwin`, `linux`, etc.). In CI, always generate and compare on the same OS.

## Adding a new feature

1. `features/<name>/<name>.feature` with `@<name>` tag
2. `dsl/<name>Dsl.ts` — plain class taking `BrowserDsl` (or abstract class extending it for exception features)
3. Add field to `context/ScenarioContext.ts`
4. Wire in `adapters/playwright/index.ts` (`createPlaywrightContext`)
5. `steps/<name>Steps.ts` importing `{ Given, When, Then }` from `../support/bdd`
