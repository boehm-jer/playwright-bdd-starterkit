# Test Layer Conventions

> Companion to [FEATURE_FILE_CONVENTIONS.md](FEATURE_FILE_CONVENTIONS.md). That document governs
> the Gherkin. This one governs everything underneath it: how a `.feature` file, its step
> definitions, and its DSL relate — and what is allowed to live in each.
>
> These rules are **intentional and load-bearing**. They are what keeps the project
> driver-agnostic. An AI agent adding or editing a feature should treat this document as
> normative and prefer breaking a task into more work over breaking one of these rules.

## Table of contents

- [The triad: every feature is exactly three files](#the-triad-every-feature-is-exactly-three-files)
- [One identifier, propagated everywhere](#one-identifier-propagated-everywhere)
- [Layer responsibilities](#layer-responsibilities)
- [Import rules (the enforcement mechanism)](#import-rules-the-enforcement-mechanism)
- [The step definition layer](#the-step-definition-layer)
- [The DSL layer: two kinds of file](#the-dsl-layer-two-kinds-of-file)
  - [Kind 1 — Feature DSL](#kind-1--feature-dsl)
  - [Kind 2 — Shared DSL and helpers](#kind-2--shared-dsl-and-helpers)
    - [Primitive contracts (`dsl/base/`)](#primitive-contracts-dslbase)
    - [Shared domain DSLs (`dsl/shared/<domain>/`)](#shared-domain-dsls-dslshareddomain)
    - [Helpers (`helpers/`)](#helpers-helpers)
- [Where assertions live](#where-assertions-live)
- [Where scenario state lives](#where-scenario-state-lives)
- [Naming conventions](#naming-conventions)
- [Wiring a feature into the container](#wiring-a-feature-into-the-container)
- [Worked example — standard feature](#worked-example--standard-feature)
- [Worked example — exception feature](#worked-example--exception-feature)
- [Worked example — shared domain DSL](#worked-example--shared-domain-dsl)
- [Anti-patterns](#anti-patterns)
- [Agent checklist](#agent-checklist)

---

## The triad: every feature is exactly three files

A feature is **always** represented by three files, and only three:

```
features/<name>/<name>.feature     the specification    (what the business asked for)
steps/<name>Steps.ts               the binding          (Gherkin phrase → DSL call)
dsl/<name>Dsl.ts                   the vocabulary       (what this feature can do)
```

The relationship is strictly **1 : 1 : 1**.

- Never write a feature file without its own dedicated step file and its own dedicated DSL file.
- Never let two features share a step file or a DSL file.
- Never split one feature across two step files or two DSL files.
- If a feature seems to need a fourth file, it doesn't — the code belongs in
  [`dsl/base/`](dsl/base/) (a new browser primitive), `dsl/shared/<domain>/` (behaviour several
  features share), or [`helpers/`](helpers/) (a stateless utility). See
  [Kind 2](#kind-2--shared-dsl-and-helpers).

An **exception feature** (one that cannot be expressed through generic browser primitives) adds a
_fourth_ file, but it is a driver adapter, not a fourth test-layer file:
`adapters/playwright/Playwright<Name>Dsl.ts`. The triad is still intact — the extra file is the
price of driver specificity, and it lives in the driver's folder, not the feature's.

### Why the triad is rigid

Each file answers exactly one question, and the split is what makes the driver swappable:

| File             | Question it answers                           | Audience                        |
| ---------------- | --------------------------------------------- | ------------------------------- |
| `.feature`       | _What behaviour do we want?_                  | Anyone, including non-engineers |
| `<name>Steps.ts` | _Which capability does this sentence invoke?_ | The BDD runner                  |
| `<name>Dsl.ts`   | _What can this feature do, and how?_          | Engineers                       |

Collapse any two and one of the questions stops being answerable independently.

---

## One identifier, propagated everywhere

Pick the feature name once, in `camelCase`, and it appears — unchanged — in every location:

| Location                 | Form                                         | Example                     |
| ------------------------ | -------------------------------------------- | --------------------------- |
| Feature folder           | `features/<name>/`                           | `features/pdfDownload/`     |
| Feature file             | `<name>.feature`                             | `pdfDownload.feature`       |
| Feature tag              | `@<name>`                                    | `@pdfDownload`              |
| Step file                | `steps/<name>Steps.ts`                       | `steps/pdfDownloadSteps.ts` |
| DSL file                 | `dsl/<name>Dsl.ts`                           | `dsl/pdfDownloadDsl.ts`     |
| DSL class                | `<Name>Dsl`                                  | `PdfDownloadDsl`            |
| Container field          | `scenario.<name>`                            | `scenario.pdfDownload`      |
| Adapter (exception only) | `adapters/playwright/Playwright<Name>Dsl.ts` | `PlaywrightPdfDownloadDsl`  |

There are no synonyms and no abbreviations anywhere in that chain. Given any one of these, an
agent must be able to derive all the others mechanically.

---

## Layer responsibilities

```
.feature  →  steps/  →  dsl/  →  adapters/  →  Browser
```

| Layer              | Owns                                                | Must never contain                                  |
| ------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `features/`        | Business intent, scenario data                      | Selectors, URLs, mechanics                          |
| `steps/`           | Gherkin phrase → DSL call mapping                   | Selectors, URLs, control flow, browser APIs, state  |
| `dsl/<name>Dsl.ts` | Feature vocabulary, selectors, URLs, business logic | Driver imports (standard features)                  |
| `dsl/base/`        | Driver-neutral primitive contracts                  | Feature-specific concepts                           |
| `dsl/shared/`      | Domain behaviour reused by several feature DSLs     | Knowledge of which feature is calling it            |
| `adapters/`        | Driver translation, driver-only capabilities        | Business logic that could live in a DSL             |
| `helpers/`         | App-wide interactions and stateless utilities       | Domain knowledge, state, anything one feature needs |

Each arrow is one-way. A layer may only know about the layer immediately to its right.

---

## Import rules (the enforcement mechanism)

The conventions above are observable as import lists. These are the hard rules:

**`steps/<name>Steps.ts` may import exactly two things:**

```typescript
import { Given, When, Then } from "../support/bdd"; // always
import { expect } from "@playwright/test"; // only if the step asserts a returned value
```

Nothing else. Not the DSL class (it arrives via `{ scenario }`), not `by`, not `Page`, not a
helper, not an adapter, not `path` or `fs`.

**`dsl/<name>Dsl.ts` — standard feature:**

```typescript
import { BrowserDsl } from "./base/BrowserDsl";
import { by } from "../support/selector";
```

It may additionally import shared domain DSLs it composes and interaction helpers it calls:

```typescript
import { InvoiceDetailsSectionDsl } from "./shared/invoice/invoiceDetailsSectionDsl";
import { clickSave, selectFromDropdown } from "../helpers/interactionHelpers";
```

Never `@playwright/test`. A standard DSL that imports the driver is a bug, not a shortcut.

**`dsl/<name>Dsl.ts` — exception feature:**

```typescript
import { BrowserDsl } from "./base/BrowserDsl";
```

Declarations only. It may also export supporting types (see `AxeViolation` in
[dsl/accessibilityDsl.ts](dsl/accessibilityDsl.ts)).

**`helpers/*Helpers.ts`** — interaction helpers import `BrowserDsl` and `by`, never
`@playwright/test`. Utility helpers may import the driver, but then only `adapters/` may import
them.

**`dsl/shared/<domain>/*Dsl.ts`** follows the same rules as the feature DSL variant it mirrors —
`BrowserDsl` and `by` for the standard shape, declarations only for the exception shape. It may also
import another shared DSL. It may **never** import from `dsl/` root (a feature DSL), from `steps/`,
or from `adapters/`.

**`adapters/playwright/*` may import anything** — that is the point of the layer.

**`context/ScenarioContext.ts` imports only from `dsl/`** — never from `adapters/`. The container
is typed against contracts, not implementations.

---

## The step definition layer

**A step body consists of nothing but calls to DSL methods.** This is the single most important
rule in this document.

Legal contents of a step body, and nothing else:

1. One or more `await scenario.<feature>.<method>(...)` calls.
2. Optionally, capturing the return of the last such call into a `const`.
3. Optionally, a single `expect(...)` assertion on that captured value.

```typescript
// steps/submitSteps.ts — the canonical shapes
Given("I am on the submission page", async ({ scenario }) => {
  await scenario.submit.navigateToSubmissionPage(); // void DSL call
});

When("I enter the coupon code {string}", async ({ scenario }, text: string) => {
  await scenario.submit.enterText(text); // Gherkin param passed straight through
});

Then(
  "the page should confirm a successful form submission",
  async ({ scenario }) => {
    const confirmed = await scenario.submit.isSubmissionConfirmed(); // DSL returns data
    expect(confirmed).toBe(true); // step asserts
  },
);
```

### Rules

- **A step may call more than one DSL method.** A `Given` that both navigates and confirms arrival
  is legitimate — see [steps/pdfDownloadSteps.ts](steps/pdfDownloadSteps.ts). What it may not do is
  contain anything that is _not_ a DSL call.
- **No logic.** No `if`, no loops, no `try`/`catch`, no string manipulation, no arithmetic, no
  building of selectors or URLs. If a step needs a decision made, the decision belongs in the DSL.
- **No primitives.** Exception-feature DSLs extend `BrowserDsl` and therefore expose `click`,
  `fill`, etc. on `scenario.<feature>`. Steps must still never call them. A step calls only the
  methods the feature DSL itself declares.
- **Gherkin parameters pass straight through.** `{string}` captures become typed function
  parameters and are forwarded to the DSL untouched.
- **Step text is globally unique.** `playwright-bdd` registers step definitions globally across all
  step files, so two features cannot both define `Given("I am on the home page")`. Phrase each
  step so it is unmistakably about its own feature (`"I am visiting {string}"` vs
  `"I am visiting the website"`).
- **A step file defines steps only for its own feature file**, and every step in that feature file
  has a definition in that step file.

---

## The DSL layer: two kinds of file

`dsl/` holds two categorically different kinds of file. Confusing them is the most common way to
break the architecture.

### Kind 1 — Feature DSL

`dsl/<name>Dsl.ts`. **Named after a feature file, dedicated to that feature file, used by exactly
one step file.** Its public methods are the complete vocabulary of that feature — read the class
and you can predict the feature file's steps.

It comes in two variants:

**Standard (driver-agnostic) — the default. Always prefer this.**

A plain class that receives `BrowserDsl` by constructor injection and expresses everything through
primitives and `by.*` selectors:

```typescript
export class SubmitDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async enterText(text: string): Promise<void> {
    await this.browser.scrollIntoView(by.label("Coupon Code"));
    await this.browser.fill(by.label("Coupon Code"), text);
    await this.browser.pressKey("Enter");
  }
}
```

**Exception (driver-specific) — only when the driver's own API is unavoidable.**

An abstract class _extending_ `BrowserDsl`, declaring feature methods with no bodies. It is a
contract; the implementation lives in the adapter:

```typescript
export abstract class PdfDownloadDsl extends BrowserDsl {
  abstract visitWikimediaPage(): Promise<void>;
  abstract verifyPageLoaded(): Promise<void>;
  abstract downloadPdf(): Promise<void>;
  abstract validatePdfContent(): Promise<void>;
}
```

The adapter then `extends PlaywrightBrowserDsl implements <Name>Dsl` — it inherits the concrete
primitives and satisfies the feature contract. It does **not** extend the abstract DSL directly.

Choose _exception_ only for a capability the primitives genuinely cannot reach — download events,
page injection, screenshot diffing. The current exceptions are `accessibility`, `pdfDownload`, and
`visualRegression`. Wanting a Playwright convenience API is not a qualifying reason; adding a
primitive to `BrowserDsl` is the better answer when two or more features would use it.

**Method naming.** Feature DSL methods are named at the level of _intent within that feature_
(`downloadPdf`, `isSubmissionConfirmed`, `getViolationsAtOrAbove`) — one notch more concrete than
the Gherkin sentence, several notches more abstract than the mechanics. They are never named after
mechanics (`clickDownloadButton`) and never after the Gherkin sentence verbatim.

**The DSL owns the details.** URLs, selectors, protocol prefixes, waits, and ordering all live
here. `AccessibilityDsl` receives `"w3.org/WAI/..."` from the feature file and adds `https://`
itself — the feature file states only what it cares about.

### Kind 2 — Shared DSL and helpers

The second kind of file is **not tied to any feature**. It exists so feature DSLs stay small and so
the same capability is not re-implemented per feature. It has three tiers, and picking the right one
is a design decision, not a filing decision:

| Tier                    | Location               | Holds                                                            | Example                                                 |
| ----------------------- | ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **Primitive contracts** | `dsl/base/`            | Driver-neutral browser capabilities every adapter must implement | `BrowserDsl.click`, `BaseDsl.navigate`                  |
| **Shared domain DSLs**  | `dsl/shared/<domain>/` | App-domain behaviour reused by several feature DSLs              | `invoiceDetailsSectionDsl`, `invoicePaymentsSectionDsl` |
| **Helpers**             | `helpers/`             | Stateless functions — app-wide interactions, and data plumbing   | `clickSave`, `selectFromDropdown`, PDF text extraction  |

Deciding between them, in order:

- Is it a capability the driver must provide, that existing primitives cannot compose?
  → **primitive** in `dsl/base/`.
- Does it work on any screen, and would it read the same in an app from a different business
  entirely? → **interaction helper** in `helpers/`.
- Does it interact with the app in the app's _own_ vocabulary, reused by several features?
  → **shared domain DSL** in `dsl/shared/<domain>/`.
- Is it data, file, math, or assertion plumbing? → **utility helper** in `helpers/`.

The discriminator between the middle two is domain knowledge, not browser interaction — both drive
the browser. A dropdown is a dropdown in any app; an invoice payments section is not.

#### Primitive contracts (`dsl/base/`)

[BaseDsl.ts](dsl/base/BaseDsl.ts) declares the driver-neutral, selector-free primitives (`navigate`,
`getTitle`, `getUrl`); [BrowserDsl.ts](dsl/base/BrowserDsl.ts) extends it with the selector-driven
ones (`click`, `fill`, `isVisible`, …), and [support/selector.ts](support/selector.ts) supplies the
`Selector` union and `by.*` builders they speak in.

Adding a method here obliges **every** adapter, for every driver, to implement it. Do it only when
two or more features need a genuinely primitive capability — never to make one feature's DSL shorter.

#### Shared domain DSLs (`dsl/shared/<domain>/`)

This tier is what keeps the triad workable at scale. When several features touch the same part of
the application, the shared behaviour belongs in a DSL named after **the domain area, not any
feature**.

Take an app with five invoice-related features. The wrong shapes are both extremes: one giant
`invoiceDsl` serving five feature files (it breaks the 1:1:1 triad and becomes a monster), or five
feature DSLs each re-implementing the same invoice screens. The right shape is both:

```
dsl/purchaseInvoicesDsl.ts              feature DSL   — 1:1 with features/purchaseInvoices/
dsl/salesInvoicesDsl.ts                 feature DSL   — 1:1 with features/salesInvoices/
dsl/creditNotesDsl.ts                   feature DSL   — 1:1 with features/creditNotes/

dsl/shared/invoice/invoiceDetailsSectionDsl.ts     shared — the details section, wherever it appears
dsl/shared/invoice/invoicePaymentsSectionDsl.ts    shared — the payments section
dsl/shared/invoice/invoiceLineItemsDsl.ts          shared — line-item grid behaviour
```

Each feature DSL keeps its own scenario-level vocabulary and **delegates** the shared parts:

```typescript
// dsl/purchaseInvoicesDsl.ts
export class PurchaseInvoicesDsl {
  constructor(
    private readonly browser: BrowserDsl,
    private readonly details: InvoiceDetailsSectionDsl,
    private readonly payments: InvoicePaymentsSectionDsl,
  ) {}

  async approvePurchaseInvoice(): Promise<void> {
    await this.details.expandSection();
    await this.browser.click(by.role("button", { name: "Approve" }));
  }

  async getOutstandingBalance(): Promise<string> {
    return this.payments.getBalance(); // shared section owns the selector
  }
}
```

Rules for shared domain DSLs:

- **Named for a domain area or page section, never for a feature.** `invoiceDetailsSectionDsl` is
  correct; `purchaseInvoiceHelperDsl` is a feature DSL wearing a disguise.
- **Same shape as a standard feature DSL** — a plain class taking `BrowserDsl`, using `by.*`,
  returning data, never importing the driver and never calling `expect`. If it needs a driver-only
  API it follows the exception variant: an abstract class in `dsl/shared/<domain>/` plus a
  `adapters/playwright/Playwright<Name>Dsl.ts` implementation.
- **Never exposed on `ScenarioContext`.** Shared DSLs are constructor-injected into the feature DSLs
  that need them, by the factory in [adapters/playwright/index.ts](adapters/playwright/index.ts).
  Putting one on `scenario` would let a step call `scenario.invoiceDetailsSection.…` directly,
  bypassing the feature's own vocabulary and dissolving the triad. **Steps reach exactly one DSL:
  their own feature's.**
- **Dependencies point down, never up or sideways into features.** A shared DSL may compose another
  shared DSL. It must never import a feature DSL, and must never know which feature is using it.
- **Extract on the second use, not the first.** Behaviour lives as a private method on the feature
  DSL until a second feature needs it; then it is promoted to `dsl/shared/<domain>/`. Speculative
  sharing produces the same monster as no sharing.
- **One instance per scenario, shared by every feature DSL that takes it.** The factory constructs it
  once and passes the same object in, so any state it holds stays consistent within the scenario and
  still resets between scenarios.

#### Helpers (`helpers/`)

Helpers are stateless named functions (never classes) reused across the project. They come in two
sub-kinds, and both are called by DSLs and adapters — **never by a step**.

**Interaction helpers — app-wide browser interactions.**

Compositions of `BrowserDsl` primitives that apply anywhere in the application and carry no domain
knowledge: clicking the save button, choosing from a dropdown, setting a date field. They take a
`BrowserDsl` as their first parameter, which keeps them as driver-agnostic as the DSLs that call
them:

```typescript
// helpers/interactionHelpers.ts
import { BrowserDsl } from "../dsl/base/BrowserDsl";
import { by } from "../support/selector";

export async function clickSave(browser: BrowserDsl): Promise<void> {
  await browser.click(by.role("button", { name: "Save" }));
}

export async function selectFromDropdown(
  browser: BrowserDsl,
  label: string,
  option: string,
): Promise<void> {
  await browser.click(by.label(label));
  await browser.click(by.role("option", { name: option }));
}

export async function setDateInput(
  browser: BrowserDsl,
  label: string,
  isoDate: string,
): Promise<void> {
  await browser.fill(by.label(label), isoDate);
  await browser.pressKey("Escape"); // dismiss the picker overlay
}
```

Any DSL then reads at the level of intent while the mechanics stay in one place:

```typescript
async approveInvoice(approver: string, approvedOn: string): Promise<void> {
  await selectFromDropdown(this.browser, "Approver", approver);
  await setDateInput(this.browser, "Approval date", approvedOn);
  await clickSave(this.browser);
}
```

Rules:

- **Take `BrowserDsl`, never `Page`.** A helper typed against the driver is no longer portable and
  becomes importable only from `adapters/`. Adapters can still use these helpers — a
  `PlaywrightBrowserDsl` _is_ a `BrowserDsl`, so an adapter passes `this`.
- **No domain knowledge.** The moment a helper knows what an invoice is, it belongs in
  `dsl/shared/<domain>/` as a DSL, not in `helpers/`.
- **Compose, don't extend the contract.** If the behaviour can be written with existing primitives,
  it is an interaction helper. Only a genuinely new browser capability justifies a `BrowserDsl`
  method, because that obliges every adapter, for every driver, to implement it.
- **Named as imperative verbs** — `clickSave`, `selectFromDropdown`, `setDateInput`.

**Utility helpers — data, file, and assertion plumbing.**

No browser interaction of their own: [accessibilityImpactHelpers.ts](helpers/accessibilityImpactHelpers.ts)
is pure TypeScript; [pdfValidationHelpers.ts](helpers/pdfValidationHelpers.ts) reads and parses a
file. A utility helper may be driver-aware — [visualRegressionHelpers.ts](helpers/visualRegressionHelpers.ts)
takes a Playwright `Page` — but then it is importable **only from `adapters/`**, never from a
standard DSL.

Rules for both sub-kinds:

- **Never feature-specific.** A helper must be usable by a feature that does not exist yet. If only
  one feature will ever call it, keep it as a private DSL method.
- **Never imported by a step.** A step calls a DSL method; the DSL calls the helper.
- **Naming:** `helpers/<domain>Helpers.ts`, exporting named functions (not a class).
- **Stateless.** Anything that needs to remember something between calls is a DSL, not a helper —
  see [Where scenario state lives](#where-scenario-state-lives).

---

## Where assertions live

Two legal placements, chosen by feature variant — not by taste:

**Standard features → the DSL returns data, the step asserts.**

The DSL cannot import `expect` (it is driver-coupled), so a driver-agnostic DSL exposes a query
method with a meaningful return type and the step makes the claim:

```typescript
// dsl/sampleDsl.ts
async getTitle(): Promise<string> { return this.browser.getTitle(); }

// steps/sampleSteps.ts
const title = await scenario.sample.getTitle();
expect(title).toContain(keyword);
```

**Exception features → the adapter asserts internally, the step calls a `Promise<void>` method.**

Here the assertion _is_ the driver capability (`toHaveScreenshot`, PDF text extraction), so
extracting it would be meaningless:

```typescript
// steps/visualRegressionSteps.ts
await scenario.visualRegression.compareWithBaseline(); // asserts inside the adapter
```

Never assert inside a standard DSL, and never re-assert in a step over an
already-asserting exception method.

---

## Where scenario state lives

`ScenarioContext` is constructed once per test by the fixture, so **DSL instance fields are
per-scenario state**. When one step must hand a value to a later step, store it as a private field
on the DSL/adapter:

```typescript
export class PlaywrightVisualRegressionDsl
  extends PlaywrightBrowserDsl
  implements VisualRegressionDsl
{
  private pendingScreenshotName = "";

  async setScreenshotName(name: string): Promise<void> {
    this.pendingScreenshotName = name;
  }
  async compareWithBaseline(): Promise<void> {
    await compareScreenshot(this.page, this.pendingScreenshotName);
  }
}
```

Never use a module-level variable in a step file, and never attach state to `scenario` itself.
Module state leaks across scenarios and breaks parallel execution.

---

## Naming conventions

| Location               | Filename case                   | Example                                              |
| ---------------------- | ------------------------------- | ---------------------------------------------------- |
| `features/<name>/`     | camelCase folder and file       | `features/visualRegression/visualRegression.feature` |
| `steps/`               | camelCase, `Steps` suffix       | `visualRegressionSteps.ts`                           |
| `dsl/` (feature DSLs)  | camelCase, `Dsl` suffix         | `visualRegressionDsl.ts`                             |
| `dsl/base/`            | PascalCase                      | `BrowserDsl.ts`                                      |
| `dsl/shared/<domain>/` | camelCase, `Dsl` suffix         | `invoiceDetailsSectionDsl.ts`                        |
| `adapters/playwright/` | PascalCase, `Playwright` prefix | `PlaywrightVisualRegressionDsl.ts`                   |
| `helpers/`             | camelCase, `Helpers` suffix     | `visualRegressionHelpers.ts`                         |

Classes are always PascalCase regardless of filename case. The lowercase filename in `dsl/` and
`dsl/shared/` marks "application vocabulary"; the PascalCase filename in `dsl/base/` and `adapters/`
marks "infrastructure". Depth says the rest: a `Dsl` file directly in `dsl/` is bound to one feature,
one in `dsl/shared/<domain>/` is bound to none.

---

## Wiring a feature into the container

Two files change, and they must stay in lockstep:

1. [context/ScenarioContext.ts](context/ScenarioContext.ts) — add a `public readonly <name>:` field
   typed as the **`dsl/` export** (concrete class for standard, abstract class for exception).
   Never type it as the adapter.
2. [adapters/playwright/index.ts](adapters/playwright/index.ts) — construct the instance in
   `createPlaywrightContext`. Standard DSLs receive the shared `browser` instance; exception
   adapters receive `page` directly.

`ScenarioContext`'s constructor is **positional** — append the new field at the end of the
constructor and the matching argument at the end of the `new ScenarioContext(...)` call. Getting
the two orders out of sync misassigns every DSL after the insertion point.

Shared domain DSLs are wired differently: they are constructed in the same factory but **passed
into the feature DSLs that need them**, not added to `ScenarioContext`.

```typescript
export function createPlaywrightContext(page: Page): ScenarioContext {
  const browser = new PlaywrightBrowserDsl(page);

  // shared domain DSLs — constructed once, injected, never exposed on the context
  const invoiceDetails = new InvoiceDetailsSectionDsl(browser);
  const invoicePayments = new InvoicePaymentsSectionDsl(browser);

  return new ScenarioContext(
    new PurchaseInvoicesDsl(browser, invoiceDetails, invoicePayments),
    new SalesInvoicesDsl(browser, invoiceDetails),
    // …
  );
}
```

`ScenarioContext` therefore has exactly one field per feature — no more, no fewer. That invariant is
what guarantees a step can only reach its own feature's vocabulary.

No other file changes. `fixtures.ts` and `support/bdd.ts` are written once and never touched again.

---

## Worked example — standard feature

Feature `checkout`, driver-agnostic. Three test-layer files plus two wiring edits.

**1. `features/checkout/checkout.feature`**

```gherkin
@checkout
Feature: Checkout
  A shopper can complete a purchase.

  Scenario: Applying a valid promo code reduces the total
    Given I am on the checkout page with one item in my cart
    When I apply the promo code "SAVE10"
    Then the order total should reflect the discount
```

**2. `steps/checkoutSteps.ts`**

```typescript
import { Given, When, Then } from "../support/bdd";
import { expect } from "@playwright/test";

Given(
  "I am on the checkout page with one item in my cart",
  async ({ scenario }) => {
    await scenario.checkout.goToCheckoutWithOneItem();
  },
);

When("I apply the promo code {string}", async ({ scenario }, code: string) => {
  await scenario.checkout.applyPromoCode(code);
});

Then("the order total should reflect the discount", async ({ scenario }) => {
  const total = await scenario.checkout.getOrderTotal();
  expect(total).toBe("$90.00");
});
```

**3. `dsl/checkoutDsl.ts`**

```typescript
import { BrowserDsl } from "./base/BrowserDsl";
import { by } from "../support/selector";

export class CheckoutDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async goToCheckoutWithOneItem(): Promise<void> {
    await this.browser.navigate("https://example.com/checkout?items=1");
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.browser.fill(by.label("Promo code"), code);
    await this.browser.click(by.role("button", { name: "Apply" }));
  }

  async getOrderTotal(): Promise<string> {
    return this.browser.getText(by.testId("order-total"));
  }
}
```

**4. Wiring** — add `public readonly checkout: CheckoutDsl` to `ScenarioContext` and
`new CheckoutDsl(browser)` in the same position in `createPlaywrightContext`.

---

## Worked example — exception feature

Only the differences from the standard path. The `.feature` and `steps/` files look exactly the
same; the DSL becomes a contract and an adapter implements it.

**`dsl/fileUploadDsl.ts`**

```typescript
import { BrowserDsl } from "./base/BrowserDsl";

export abstract class FileUploadDsl extends BrowserDsl {
  abstract goToUploadPage(): Promise<void>;
  abstract uploadFile(fileName: string): Promise<void>;
  abstract verifyUploadAccepted(): Promise<void>;
}
```

**`adapters/playwright/PlaywrightFileUploadDsl.ts`**

```typescript
import { expect } from "@playwright/test";
import { FileUploadDsl } from "../../dsl/fileUploadDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";

export class PlaywrightFileUploadDsl
  extends PlaywrightBrowserDsl
  implements FileUploadDsl
{
  async goToUploadPage(): Promise<void> {
    await this.page.goto("https://example.com/upload");
  }

  async uploadFile(fileName: string): Promise<void> {
    const chooser = this.page.waitForEvent("filechooser"); // driver-only capability
    await this.page.getByRole("button", { name: "Choose file" }).click();
    await (await chooser).setFiles(fileName);
  }

  async verifyUploadAccepted(): Promise<void> {
    await expect(this.page.getByText("Upload complete")).toBeVisible();
  }
}
```

**Wiring** — `ScenarioContext` holds `public readonly fileUpload: FileUploadDsl` (the abstract
type), and `createPlaywrightContext` constructs `new PlaywrightFileUploadDsl(page)`.

---

## Worked example — shared domain DSL

Two features — `purchaseInvoices` and `salesInvoices` — both work with the invoice payments section.
Each keeps its own triad; the section becomes a shared DSL.

**`dsl/shared/invoice/invoicePaymentsSectionDsl.ts`** — owns the section, knows no feature:

```typescript
import { BrowserDsl } from "../../base/BrowserDsl";
import { by } from "../../../support/selector";

export class InvoicePaymentsSectionDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async recordPayment(amount: string): Promise<void> {
    await this.browser.click(by.role("button", { name: "Record payment" }));
    await this.browser.fill(by.label("Amount"), amount);
    await this.browser.click(by.role("button", { name: "Save payment" }));
  }

  async getBalance(): Promise<string> {
    return this.browser.getText(by.testId("invoice-outstanding-balance"));
  }
}
```

**`dsl/purchaseInvoicesDsl.ts`** — feature vocabulary, delegating the section:

```typescript
export class PurchaseInvoicesDsl {
  constructor(
    private readonly browser: BrowserDsl,
    private readonly payments: InvoicePaymentsSectionDsl,
  ) {}

  async goToPurchaseInvoice(reference: string): Promise<void> {
    await this.browser.navigate(
      `https://example.com/purchase-invoices/${reference}`,
    );
  }

  async payInFull(amount: string): Promise<void> {
    await this.payments.recordPayment(amount);
  }

  async getOutstandingBalance(): Promise<string> {
    return this.payments.getBalance();
  }
}
```

**`steps/purchaseInvoicesSteps.ts`** — unchanged in character. The step cannot tell that a shared DSL
exists, and that is the point:

```typescript
When("I pay the purchase invoice in full", async ({ scenario }) => {
  await scenario.purchaseInvoices.payInFull("500.00");
});

Then(
  "the purchase invoice should show no outstanding balance",
  async ({ scenario }) => {
    const balance = await scenario.purchaseInvoices.getOutstandingBalance();
    expect(balance).toBe("$0.00");
  },
);
```

`salesInvoicesDsl` composes the same `InvoicePaymentsSectionDsl` for its own scenarios. When the
payments UI changes, one file changes.

---

## Anti-patterns

| Anti-pattern                                                        | Why it's wrong                                                               | Do instead                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Two features sharing one step or DSL file                           | Breaks the 1:1:1 triad; couples unrelated features                           | One triad per feature                                                     |
| `await scenario.pdfDownload.click(by.css(".x"))` in a step          | Primitives leaked past the DSL                                               | Add a named method to the feature DSL                                     |
| `if` / loop / string building in a step                             | Logic escaped the DSL                                                        | Move the decision into the DSL method                                     |
| `import { Page } from "@playwright/test"` in a step or standard DSL | Driver coupling; kills portability                                           | Use `BrowserDsl` primitives and `by.*`                                    |
| A URL or CSS selector in a `.feature` file                          | Feature files state intent, not mechanics                                    | Keep it in the DSL; parameterise only what the scenario is _about_        |
| `expect` inside a standard DSL                                      | Standard DSLs must not import the driver                                     | Return data; assert in the step                                           |
| `let lastValue` at module scope in a step file                      | Leaks across scenarios, breaks parallelism                                   | Private field on the DSL instance                                         |
| A step importing from `helpers/`                                    | Skips the DSL layer entirely                                                 | Call a DSL method that uses the helper                                    |
| `ScenarioContext` importing from `adapters/`                        | Container must depend on contracts only                                      | Type the field as the `dsl/` export                                       |
| Adapter written for a feature the primitives cover                  | Creates needless driver work per feature                                     | Use the standard variant                                                  |
| A shared domain DSL exposed on `ScenarioContext`                    | Lets a step bypass its feature's vocabulary; dissolves the triad             | Inject it into the feature DSLs that need it                              |
| One `invoiceDsl` serving five invoice feature files                 | Breaks 1:1:1 and grows into a monster                                        | Feature DSL per feature + shared section DSLs under `dsl/shared/invoice/` |
| A shared DSL importing a feature DSL                                | Dependency points upward; couples the domain to one feature                  | Keep shared DSLs feature-blind; move the logic down                       |
| A shared DSL named after a feature (`purchaseInvoiceSharedDsl`)     | It is a feature DSL in disguise                                              | Name it for the domain area or page section                               |
| Extracting to `dsl/shared/` on first use                            | Speculative sharing is as costly as none                                     | Keep it private until a second feature needs it                           |
| `selectFromDropdown` added to `BrowserDsl`                          | A composition of existing primitives; forces every adapter to reimplement it | Interaction helper in `helpers/` taking `BrowserDsl`                      |
| An interaction helper typed `(page: Page, …)`                       | Driver-coupled, so no standard DSL can call it                               | Type the first parameter as `BrowserDsl`                                  |
| An interaction helper that knows about invoices                     | Domain knowledge escaped into `helpers/`                                     | Move it to `dsl/shared/<domain>/` as a DSL                                |
| A helper holding state between calls                                | Helpers are stateless; state must reset per scenario                         | Private field on a DSL instance                                           |
| A helper only one feature will ever use                             | Fragments the feature's own vocabulary                                       | Keep it as a private DSL method                                           |
| New primitive added to `BrowserDsl` for one feature                 | Forces every adapter to implement it                                         | Keep it in the feature's DSL/adapter until a second feature needs it      |

---

## Agent checklist

Before finishing any feature work, verify:

- [ ] Exactly three files exist for the feature, named from the same identifier (plus one adapter if — and only if — it is an exception feature).
- [ ] The feature file carries `@<name>` matching its folder.
- [ ] Every step in the feature file has a definition in `steps/<name>Steps.ts`, and that file defines nothing else.
- [ ] Every step body contains only DSL calls, an optional captured `const`, and an optional `expect` on it.
- [ ] The step file imports only `../support/bdd` and (if asserting) `expect`.
- [ ] The DSL is standard unless a driver-only API is genuinely required.
- [ ] A standard DSL imports no driver code and contains no `expect`.
- [ ] Selectors, URLs, and waits live in the DSL/adapter — never in the feature or step file.
- [ ] Cross-step state is a private field on the DSL instance.
- [ ] App-wide interactions (`clickSave`, `selectFromDropdown`, `setDateInput`) are interaction helpers taking `BrowserDsl` — not new `BrowserDsl` primitives and not domain DSLs.
- [ ] Behaviour shared with another feature lives in `dsl/shared/<domain>/`, is named for the domain, imports no feature DSL, and is injected — not added to `ScenarioContext`.
- [ ] `ScenarioContext` has exactly one field per feature.
- [ ] `ScenarioContext` and `createPlaywrightContext` were updated in the same position, with the field typed as the `dsl/` export.
- [ ] Step text does not collide with any step defined by another feature.
- [ ] The Gherkin obeys [FEATURE_FILE_CONVENTIONS.md](FEATURE_FILE_CONVENTIONS.md).
