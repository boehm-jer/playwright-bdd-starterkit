# Pathway: a running system with no unit tests

**Use when** the behavior lives in code you can't easily call in isolation (most custom Drupal,
WordPress and legacy PHP), but a dev, test or multidev environment exists that you can drive. This is
the common case at Proven.

The key is still produced by execution. You execute the **system** instead of a function: put it in
the scenario's state, perform the action, and record what it actually did. That keeps rule 2 intact.
The key is an observation, not a recollection.

## Finding the decisions

1. **Read the code that decides.** Look at custom modules, theme preprocess functions, form alters,
   hooks, controllers and templates with conditionals. Grep for the domain's nouns (`status`,
   `eligible`, `price`, `role`, `notify`) and for branches on them. Each branch whose outcome a
   stakeholder would care about is a decision.
2. **Use the system as each kind of user.** Try each role, each content state, and each edge of a
   form. Every place the UI behaves differently for different inputs is a decision, including ones
   the code reading missed because they live in config (see `pathway-config-driven.md`).
3. **Read the tickets** that introduced the behavior, if they exist. They tell you which decisions
   were _intended_. Decisions nobody intended are prime quiz material.

## Producing the key

For each scenario, set up its state on a **non-production** environment, perform the action, and
record the outcome with evidence:

- **Through the browser:** a throwaway Playwright script, or a scenario in this starter kit, that
  sets up the state and captures the outcome as a screenshot plus the visible text. Prefer this
  route, because it observes what a user would actually see, which is what the quiz options render.
- **Through the back end:** `drush php:eval`, `wp eval`, an API call, or a database query, when the
  outcome isn't visible in the UI (an email queued, a field set, a webhook fired).

Write the result into the scenario table's `key` field as `{ "answer": "<CODE>", "evidence": "<what you
ran, and where the screenshot or response is saved>" }`. Then render with the bundled
`scripts/quiz.mjs`.

**If you can't reproduce a scenario's state** (it needs production data, a third party, or a date
that has passed), don't guess. Either derive the key from the code with a `file:line` citation and
mark it `"evidence": "DERIVED: …"`, or leave `key` out and treat the scenario like the requirements
pathway. Say which scenarios are derived when you hand over the results.

## Confidence and caveats

- **High** for observed keys, as long as the environment matches production's code and config. Note
  the environment, commit and date in the key file. A multidev that is three weeks behind production
  answers a different question.
- Content and data differ between environments. Make sure each scenario's state is set up
  explicitly rather than relying on whatever content happens to exist there.
- Clean up anything you created on the shared environment.
