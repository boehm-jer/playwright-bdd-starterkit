# Feature File Conventions

> **A recipe, not a mandate.** These are the Gherkin conventions I found most effective after
> writing feature files specifically for the Cypress starter kit, which had much stricter
> requirements. I carried the parts that paid off into this project. Following them is purely a
> recommendation based on my own preference and experience — adopt them wholesale, adapt them, or
> leave them on the shelf. That said, within _this_ repo they're treated as house rules so every
> `.feature` file reads consistently.

## Keywords

- Use **only** `Given`, `When`, `Then`. Never `And`, never `But`.
- Never use `Background`.

## The one Given

- Every scenario has **exactly one `Given`**, and it comes first.
- The `Given` carries **everything unique to that scenario** — all setup, including any
  state/context and the specific input under test. It may also fold in the triggering action
  itself (e.g. navigating to a page).
- Setup is **isolated**: each scenario must run standalone, without relying on any other scenario
  or shared background.

## When = action, Then = assertion

- A `When` is **always an active interaction** — navigate, click, toggle, submit. Never passive
  (no "reads the value", no "observes the state").
- A `Then` is **always an assertion**.

## Sequencing

- After the `Given`, `When` and `Then` **strictly alternate**, starting with a `When`.
- **Terminal stacked `Then`s are allowed** — multiple assertions may pile up at the very end of
  the scenario. This happens **at most once** and **only at the end**. There is no mid-scenario
  `Then`-after-`Then`, and never two separate stacked groups.
- **`Given · Then` (no `When`)** is legal in exactly one case: when the action is folded into the
  `Given` (typically navigation) and the only remaining step is the assertion. This is the only
  circumstance a `When` is omitted.

## Legal scenario shapes (nothing more complex than these)

- `Given · Then`
- `Given · Then · Then`
- `Given · When · Then`
- `Given · When · Then · When · Then · …` (strict alternation)
- `Given · When · Then · Then`
- `Given · When · Then · When · Then · Then`

## Scenario Outline

- Allowed. Follows the exact same grammar, with an `Examples` table.

## Tags

Tags filter which tests run. Every feature file should have a tag matching its folder name (e.g. `@accessibility`, `@submit`).

| Tag       | Purpose                                                          |
| --------- | ---------------------------------------------------------------- |
| `@<name>` | Identifies tests by feature — used with `npm run tags-test`      |
| `@only`   | Focuses a single test during development — **never commit this** |

> **Warning:** `@only` compiles to `test.only()`. If committed, `npm run test` will silently skip every other feature. The pre-commit hook installed by `npm run setup-hooks` will block commits that contain it.

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
