# Feature File Conventions

> **A recipe, not a mandate.** These are the Gherkin conventions I found most effective after writing feature files specifically for the Cypress starter kit, which had much stricter requirements. I carried the parts that paid off into this project. Following them is purely a recommendation based on my own preference and experience — adopt them wholesale, adapt them, or leave them on the shelf. That said, within _this_ repo they're treated as house rules so every `.feature` file reads consistently.

## Keywords

- Use **only** `Given`, `When`, `Then`. Never `And`, never `But`.
- Never use `Background`.

## The one Given

- Every scenario has **exactly one `Given`**, and it comes first.
- The `Given` carries **everything unique to that scenario** — all setup, including any state/context and the specific input under test. It may also fold in the triggering action itself (e.g. navigating to a page).
- Setup is **isolated**: each scenario must run standalone, without relying on any other scenario or shared background.

## When = action, Then = assertion

- A `When` is **always an active interaction** — navigate, click, toggle, submit. Never passive (no "reads the value", no "observes the state").
- A `Then` is **always an assertion**.

## Sequencing

- After the `Given`, `When` and `Then` **strictly alternate**, starting with a `When`.
- **Terminal stacked `Then`s are allowed** — multiple assertions may pile up at the very end of the scenario. This happens **at most once** and **only at the end**. There is no mid-scenario `Then`-after-`Then`, and never two separate stacked groups.
- **`Given · Then` (no `When`)** is legal in exactly one case: when the action is folded into the `Given` (typically navigation) and the only remaining step is the assertion. This is the only circumstance a `When` is omitted.

## Legal scenario shapes (nothing more complex than these)

- `Given · Then`
- `Given · Then · Then`
- `Given · When · Then`
- `Given · When · Then · When · Then · …` (strict alternation)
- `Given · When · Then · Then`
- `Given · When · Then · When · Then · Then`

## Scenario Outline

- Allowed. Follows the exact same grammar, with an `Examples` table.

## Content

- **Don't assert that something which was never built doesn't exist.** If no one will ever build a "Delete comment" button, don't write a scenario saying users can't delete comments. Building it later would be a deliberate change to the business logic, and the scenarios would be rewritten then anyway. A "not offered" assertion is only worth writing when the control exists for some roles or states and is hidden from others.
- **The Feature description says only what the scenarios don't.** Keep it to a one-line purpose, plus rules that leave something open (e.g. "any status can change to any other"), things that deliberately don't exist (e.g. "comments can't be deleted"), and open questions. Never restate what a scenario already shows.
- **No provenance comments.** Don't add `# source: …` lines or other notes about where a scenario came from. They stop mattering within weeks; the feature files are the source of truth.
- **One Given, many assertions.** Every `Given` (and every `Examples` row) spins up its own fixtures. When several scenarios build the same setup and differ only in what they assert, merge them into one `Given` followed by stacked `Then`s, or by a `When`/`Then` walk across pages.
- **Permissions get their own feature.** Don't add "role X can't do this" scenarios to each feature. Write one permissions feature with one scenario per role: a single `Given` for the role, then a walk through the app asserting what that role is and isn't offered at each stop.

## Tags

Tags filter which tests run. Every feature file should have a tag matching its file name (e.g. `@accessibility` on `accessibility.feature`).

| Tag       | Purpose                                                          |
| --------- | ---------------------------------------------------------------- |
| `@<name>` | Identifies tests by feature — used to run a subset by tag        |
| `@only`   | Focuses a single test during development — **never commit this** |
 **Warning:** `@only` compiles to `test.only()`. If committed, the full test run will silently skip every other feature. Install a pre-commit hook that blocks commits containing it (the starter-kit ships one).

---

## Examples

Action folded into the Given — `Given · Then`:

```gherkin
Scenario: Visiting a restricted page while signed out is denied
    Given I navigate to a restricted page while signed out
    Then I should see an access-denied message
```

Terminal stacked assertions — `Given · Then · Then`:

```gherkin
Scenario: An empty search shows guidance and no results
    Given I navigate to the search page with an empty query
    Then a prompt to enter a search term is shown
    Then no results are listed
```

Simple action — `Given · When · Then`:

```gherkin
Scenario: Following a navigation link opens the destination
    Given I am on the home page
    When I click the "Docs" link
    Then the docs page is displayed
```

Alternating with a terminal stack — `Given · When · Then · When · Then · Then`:

```gherkin
Scenario: Adding an item updates the cart
    Given I am on a product page as a signed-in shopper
    When I add the product to my cart
    Then the cart count shows one item
    When I open the cart
    Then the product is listed in the cart
    Then the cart total matches the product price
```

Scenario Outline — same grammar:

```gherkin
Scenario Outline: Pages respond with their expected status
    Given I navigate to "<path>"
    Then the page returns "<status>"

    Examples:
        | path     | status |
        | /home    | 200    |
        | /about   | 200    |
        | /missing | 404    |
```
