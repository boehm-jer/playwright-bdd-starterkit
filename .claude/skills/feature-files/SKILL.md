---
name: feature-files
description: 'Write or translate behavior into Gherkin .feature files that follow Proven''s feature file conventions (one Given per scenario, only Given/When/Then, strict When/Then alternation, a short list of legal scenario shapes, a tag matching the file name), then lint them. Use this whenever someone wants feature files, Gherkin, BDD scenarios or acceptance criteria written from anything: resolved judgment-quiz results, Jira/Asana/Teamwork tickets, user stories, an SOW, a description of how a page behaves, or existing tests. Also use it to review or fix existing .feature files, or to check them against the conventions, even when the user only says "scenarios", "acceptance tests" or "BDD".'
---

# Feature files

Write `.feature` files that a business reader can approve and an engineer can implement, following
the house conventions.

**`FEATURE_FILE_CONVENTIONS.md` at the repository root is the authority. Read it before writing
anything.** This skill describes _how to get from source material to conforming files_. It doesn't
restate the rules, because two copies of the rules would drift. If the file isn't there (the skill is
being used outside a project built from the starter kit), ask for it rather than guessing. Also read
the repo's `CLAUDE.md` for where feature files live and how they're named. That layout has changed
before.

## Workflow

### 1. Collect the behaviors and their status

List each behavior the source describes as one sentence: _in this situation, when this happens, this
is the outcome._ Mark each one **resolved** (an accountable person has agreed to it) or **open**.

- **From a judgment quiz:** use only scenarios marked resolved in the results file. Each one carries
  its own situation, action and agreed outcome. See the mapping table in the `judgment-quiz` skill,
  step 7.
- **From tickets, stories or an SOW:** the acceptance criteria are candidates, but they're usually
  missing the edges (empty, expired, unauthorized, the second time). List the edges as open questions
  instead of inventing outcomes.
- **From an existing page or system:** you're writing _characterization_ scenarios, which describe
  what the system does today. Say so in the feature's description, because "what it does" isn't the
  same as "what it should do".

**Never write a `Then` for an open behavior.** An invented expected outcome becomes a test that looks
authoritative. List open behaviors for the human at the end instead (see step 5).

### 2. Group into features

There is one feature file per feature, named and tagged as `CLAUDE.md` and the conventions describe.
Before naming a new feature, check `features/` for an existing one that the behaviors belong to.

### 3. Write each scenario

Work from the conventions doc, scenario by scenario:

- **Put everything unique to the scenario into the single `Given`.** That includes role, state,
  data, and the specific input under test. Where the situation is rich (a quiz scenario's prose plus
  its `given:` lines), compress it into one readable sentence. Don't spill it into extra steps. If it
  won't fit in one sentence, the scenario is probably testing two things, so split it.
- **`When` is the user's or system's action. `Then` is the observable outcome** the business cares
  about. Describe intent, not mechanics: write "I submit the form", not "I click `#edit-submit`".
  A `Then` should state the outcome the stakeholder agreed to, in words they would recognize.
- **Pick the simplest legal shape** from the conventions doc that expresses the behavior. Several
  assertions about one outcome go in a terminal stack of `Then`s. A multi-step journey uses strict
  `When`/`Then` alternation.
- **Use a `Scenario Outline`** when scenarios differ only in data, especially boundary pairs and
  quiz twins ("was already down" / "just went down"). That puts the distinction side by side in an
  `Examples` table.
- **Reuse existing step phrases.** Search `steps/` for a phrasing that already means what you need
  before coining a new one, because each new phrase is a new step definition someone has to write.
- **Add a traceability comment** above each scenario whose source is worth keeping, such as
  `# quiz: B7 — a charge that never reached the provider` or `# source: PROJ-142`. Comments don't affect the
  grammar, and they let the next person find the decision behind a scenario.

### 4. Lint

```bash
node .claude/skills/feature-files/scripts/lint-features.mjs                    # all of features/
node .claude/skills/feature-files/scripts/lint-features.mjs features/cart.feature
```

The linter enforces the mechanical rules: allowed keywords, no `Background`, exactly one leading
`Given`, the legal shapes, an `Examples` table on every outline, the `@<file-name>` tag, and no
committed `@only`. Fix everything it reports. It can't judge whether a step describes intent or
mechanics, or whether a `Then` asserts what the stakeholder actually agreed to. Check those yourself.

If `FEATURE_FILE_CONVENTIONS.md` and the linter ever disagree, the doc wins. Update the linter and its
tests (`lint-features.test.mjs`, run with `node --test .claude/skills/feature-files/scripts/`) in the
same change.

### 5. Hand over

Report:

- the files written or changed;
- **open behaviors**, as a list of questions an accountable person needs to answer before they can
  become scenarios. If there are many, or stakeholders are likely to disagree, suggest running the
  `judgment-quiz` skill on them;
- which scenarios are characterization (current behavior) rather than agreed behavior, if any.

Implementing the steps and DSL is a separate job, governed by `TEST_LAYER_CONVENTIONS.md`. Don't
start it unless you're asked to.

## Example: a resolved quiz scenario

Quiz scenarios B4 and B7 (from the judgment-quiz worked example) are twins. In the director's
resolution, a member whose card was _declined_ is lapsed, while a member whose charge _never reached_
the payment provider needs staff attention, and keeps their benefits.

```gherkin
@membershipStatus
Feature: Membership status
  How an unpaid renewal affects a member's status, as agreed in the membership
  quiz.

  # quiz: B4, B7 — an unpaid renewal, split by whose failure it was
  Scenario Outline: An unpaid renewal lapses a membership only when the member's card was declined
    Given I am a member whose renewal charge <what happened>
    When I open my account page
    Then my membership status is "<status>"
    Then my benefits are <benefits>

    Examples:
      | what happened                                       | status          | benefits  |
      | was declined by my card issuer                      | Lapsed          | suspended |
      | never reached the payment provider during an outage | Needs attention | available |
```

## Example: a ticket with a gap

Ticket PROJ-142 says _"Members get free shipping on orders over $50."_ That gives one resolved
behavior and two open ones (exactly $50? a membership that lapses mid-checkout?):

```gherkin
@shipping
Feature: Shipping charges

  # source: PROJ-142
  Scenario: A member's order over $50 ships free
    Given I am a signed-in member with $60 of items in my cart
    When I go to checkout
    Then the shipping charge is $0.00
```

Open, and not written as scenarios: _Does an order of exactly $50.00 qualify? What does a member
whose membership expires during checkout pay?_
