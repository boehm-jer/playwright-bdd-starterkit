# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install && npx playwright install   # first-time setup
npm run setup-hooks                     # install @only pre-commit guard

npm run test        # typecheck + bddgen + run all tests (headless)
npm run typecheck   # tsc --noEmit only — `playwright test` never typechecks on its own
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

The project separates _what_ a test does from _how the browser does it_, so switching drivers requires writing exactly one new class.

```
.feature  →  steps/  →  dsl/  →  adapters/  →  Browser
```

### Layers

| Layer            | Location                     | Role                                                                   |
| ---------------- | ---------------------------- | ---------------------------------------------------------------------- |
| Feature files    | `features/`                  | Gherkin scenarios — one file per feature, tagged `@<name>`             |
| Step definitions | `steps/`                     | Map Gherkin phrases to DSL method calls via `{ scenario }`             |
| DSL classes      | `dsl/`                       | Business logic — use only `BrowserDsl` primitives and `by.*` selectors |
| Adapter          | `adapters/playwright/`       | Translates `Selector` values to Playwright `Locator`s                  |
| DI container     | `context/ScenarioContext.ts` | Holds all DSL instances for a scenario                                 |
| Fixture          | `fixtures.ts`                | Creates one `ScenarioContext` per test via `createPlaywrightContext`   |

### Key abstractions

**`BrowserDsl`** (`dsl/base/BrowserDsl.ts`) — abstract class defining every browser primitive (`click`, `fill`, `navigate`, `getText`, `isVisible`, etc.). Standard DSL classes take a `BrowserDsl` in their constructor and never import Playwright.

**`Selector` / `by`** (`support/selector.ts`) — typed discriminated union. Use `by.role(...)`, `by.label(...)`, `by.text(...)`, etc. in DSL code. `PlaywrightBrowserDsl.resolve()` is the only place that converts them to Playwright `Locator`s.

**`support/bdd.ts`** — re-exports `Given`/`When`/`Then` bound to the custom fixture. All step files import from here, not from `playwright-bdd` directly.

### Standard vs. exception features

**Standard** (driver-agnostic): DSL is a plain class taking `BrowserDsl`. Wire it by adding the DSL to `ScenarioContext` and the factory in `adapters/playwright/index.ts`.

**Exception** (driver-specific): DSL is an abstract class extending `BrowserDsl`. A `Playwright<Name>Dsl` in `adapters/playwright/` provides the concrete implementation. Currently: `accessibility` (axe-core via `page.evaluate`), `pdfDownload` (download events via `page.on`), and `visualRegression` (screenshot diff via `expect(page).toHaveScreenshot()`).

## Test layer rules

Every feature is **exactly three files** — `features/<name>.feature`, `steps/<name>Steps.ts`,
`dsl/<name>Dsl.ts` — named from one camelCase identifier that also supplies the `@<name>` tag and
the `scenario.<name>` field. Never share or split those files across features.

- **A step body contains only DSL calls** — optionally capturing the last return into a `const` and
  asserting on it (or its fields) with one or more `expect`s, most-diagnostic first. No selectors, URLs, control flow, browser APIs, or module state.
- **Step files import only** `../support/bdd` and (when asserting) `expect` from `@playwright/test`.
- `dsl/` holds two kinds of file: **feature DSLs** (`<name>Dsl.ts`, one per feature file) and
  **shared code** — `dsl/base/` (driver primitives), `dsl/shared/<domain>/` (domain behaviour reused
  by several features, e.g. `invoiceDetailsSectionDsl`), and `helpers/` (stateless functions —
  app-wide interactions like `clickSave`/`selectFromDropdown` taking `BrowserDsl`, plus data
  plumbing). Compose interactions in a helper rather than adding a `BrowserDsl` primitive, which
  would oblige every adapter to implement it.
- **Shared domain DSLs are injected into feature DSLs, never added to `ScenarioContext`** — the
  container has exactly one field per feature, so a step can only reach its own feature's vocabulary.
  Extract on first use when the code is **portable** — feature-blind, with a nameable second
  consumer and a domain-shaped signature. Search `helpers/` and `dsl/shared/` before writing
  private logic; when something close exists, add a lean sibling beside it rather than bolting a
  mode flag onto it.
- **Standard features return data and let the step assert**; exception adapters assert internally
  and expose `Promise<void>` methods. For data-driven features, return an observation plus the
  sentence describing it, and pass that sentence as the `expect` message.
- **No fixed-delay waits.** `waitFor` a concrete signal with an upper-bound timeout.
- **Every scenario passes a negative control** before it is done — see "Proving a scenario can
  fail" in the conventions doc.
- Cross-step state is a private field on the DSL instance, never module scope.

**→ Full rules, worked examples, anti-patterns, and a completion checklist: [TEST_LAYER_CONVENTIONS.md](TEST_LAYER_CONVENTIONS.md)**

## Gherkin rules

- Each scenario has exactly one `Given` step — no `Background`, no `And` chaining
- Steps describe _intent_, not browser mechanics (e.g. "I submit the form", not "I click the submit button")
- Every feature file is tagged `@<featureName>` matching its file name

## Tags

- `@<name>` — identifies a feature; used with `tags-test` to run a subset
- `@only` — focuses a single test (compiles to `test.only()`). **Never commit this.** The pre-commit hook installed by `setup-hooks` blocks commits that contain it.

## Visual regression

Snapshots live in `snapshots/` and are committed to source control. The first run against a new baseline writes the snapshot and _fails_ — that is expected. Run a second time to compare.

Update baselines after an intentional visual change:

```bash
npx playwright test --update-snapshots --grep @visualRegression
```

Snapshots are OS-specific (filename includes `darwin`, `linux`, etc.). In CI, always generate and compare on the same OS.

## Adding a new feature

1. `features/<name>.feature` with `@<name>` tag
2. `dsl/<name>Dsl.ts` — plain class taking `BrowserDsl` (or abstract class extending it for exception features)
3. Add field to `context/ScenarioContext.ts`
4. Wire in `adapters/playwright/index.ts` (`createPlaywrightContext`)
5. `steps/<name>Steps.ts` importing `{ Given, When, Then }` from `../support/bdd`

See [TEST_LAYER_CONVENTIONS.md](TEST_LAYER_CONVENTIONS.md) for worked examples of both paths.
