---
name: judgment-quiz
description: 'Pin down a project''s business logic with a blinded, BDD-style "judgment quiz", then turn the agreed behavior into Gherkin feature files. Every decision the system makes or should make (statuses, permissions, workflow transitions, eligibility, pricing, notifications, what each role sees) becomes a plain-language scenario. The person who owns that judgment answers the scenarios without seeing what the system currently does. The answers are compared with the system (by running code, observing a live site, or reading config) or with the other stakeholders, and the resolved answers become feature files. Use this skill whenever someone wants to gather, validate or sign off on business rules or requirements, run a "BDD quiz" or "judgment quiz", interview a client or SME about how something should behave, check whether tests encode a wrong belief, or produce feature files from requirements. Works without unit tests, on config-driven sites (Drupal, WordPress), and before any code exists.'
---

# Judgment quiz

A judgment quiz finds what tests can't. Tests assert that the system does what someone believed it
should, so they cannot tell you whether that belief was right. Only the person accountable for the
behavior can, and they can only do it reliably if they answer **without being shown the current
behavior first**.

**Why it exists.** A system can have a large, fully green test suite and a design doc that agrees
with the code, and still tell its users something false, because every test encodes the same wrong
belief. That kind of defect only surfaces when the person who owns the behavior looks at a real
outcome and says "that's wrong". The quiz makes that happen deliberately, for every decision at once.
In practice one quiz typically finds a defect or two, a concept missing from the model and some
wording failures, and confirms most of the design as correct, which is worth knowing too.
`references/worked-example.md` walks through an illustrative case.

The finished product is a set of **feature files** describing the agreed behavior. They are written
by the `feature-files` skill (step 7) and become the acceptance tests in a project built from this
starter kit.

## The two rules that make it work

1. **The quiz is blinded.** The answerer must never be able to tell which option the system currently
   produces, or which option came from which document or colleague. If they can, you are measuring
   agreement rather than judgment. Option order comes from a deterministic hash, nothing marks the
   key, and no option is phrased more fluently than the others.

2. **The key is never written from memory.** It comes from _executing_ the real code, _observing_ the
   running system, or _deriving_ it from config with a citation, and it is always labeled with which
   of those it was. If there is no system yet, there is no key. Then the comparison is between
   stakeholders, and that is fine. A key typed from your own understanding of the code tests your
   understanding, not the code.

## Step 0: Pick the pathway

The pathway decides where the decisions come from and where the key comes from. One quiz can mix
pathways scenario by scenario.

| Situation                                                                           | Pathway            | Key                                                  | Read                                   |
| ----------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------- | -------------------------------------- |
| The decision logic is a function you can call, ideally with unit tests              | **Tested code**    | Executed: high confidence                            | `references/pathway-tested-code.md`    |
| Custom code with no tests, but a dev/test/multidev environment exists               | **Running system** | Observed: high confidence                            | `references/pathway-running-system.md` |
| The rules live in CMS or platform configuration (workflows, roles, Views, webforms) | **Config-driven**  | Derived and cited: medium, spot-check by observation | `references/pathway-config-driven.md`  |
| Nothing is built yet, or the existing system isn't worth matching                   | **Requirements**   | None: compare stakeholders with each other           | `references/pathway-requirements.md`   |

Read the matching reference before going further. Most Proven projects are a mix of running system
and config-driven work.

## Step 1: List the decisions

A **decision** is any place the system turns facts into an outcome a stakeholder could disagree with.
Typical forms:

- **mappings**: state → outcome, role → permission, condition → message;
- **precedence**: which rule wins when two apply;
- **overrides**: "X always forces Y";
- **thresholds**: where a line sits, and what happens on each side of it;
- **partitions**: new vs existing, benign vs concerning, member vs guest;
- **gaps**: states nobody decided on but the system will reach anyway.

Give each decision a short, stable label. These are the `covers:` tags, used only for the coverage
report.

**Isolate decisions rather than enumerating inputs.** Write one scenario per decision, plus pairs that
pin a boundary or a precedence. Expect fewer scenarios than decisions, because one scenario often isolates two or three. 20–40 scenarios is a
good size: past that, answer quality drops.

## Step 2: Write the scenarios

- **Use plain operational language with no code or config terms.** Write "an editor tries to publish
  a page that is still in review", not "`transitions.publish.from` excludes `review`". The answerer
  should never need to open the source.
- **Add `given:` lines** for any fact the prose leaves ambiguous but the answer depends on.
- **Offer 3 or 4 options, every one plausible.** Each should be something a reasonable person might
  pick. A joke option makes the real choice easier and tells you nothing.
- **Render each option as the user would experience it**: the message, the status, what appears on
  screen. Don't use an internal code.
- **Include twins.** These are two situations that seem identical to the system but that a person
  would distinguish ("was already broken" vs "just broke"). If the expert answers them differently,
  the system is missing information, which is a finding no amount of code reading produces. Flag the
  pair when you hand the quiz over.

## Step 3: Build the scenario table and its views

Keep one scenario table and generate every view from it, so the quiz, the key and the coverage report
cannot drift apart.

- **Tested code:** write a project-native generator that calls the real function
  (`references/pathway-tested-code.md`).
- **Every other pathway:** write `scenarios.json` and use the bundled zero-dependency renderer. Its
  header documents the table format.

```bash
node .claude/skills/judgment-quiz/scripts/quiz.mjs scenarios.json --coverage   # fix every ⚠ first
node .claude/skills/judgment-quiz/scripts/quiz.mjs scenarios.json --key        # check the letter spread
node .claude/skills/judgment-quiz/scripts/quiz.mjs scenarios.json --quiz > judgment-quiz.md
```

`--coverage` flags keys that aren't among their own options (unanswerable), single-option scenarios
and duplicate ids. In `--key`, look at the letter distribution: if most keys land on one letter, the
quiz is partly un-blinded. Reword or swap options until it evens out.

Keep the table, the key evidence and the rendered quiz together, for example under
`docs/judgment-quiz/`. They are the record of _why_ the behavior is shaped the way it is.

## Step 4: Hand it over, and don't answer it yourself

The answerer is **the person accountable for the behavior**: the client's product owner, an SME, or
the Proven lead who owns the decision. On the requirements pathway, send the same file to each
stakeholder separately and name the one person who will settle disagreements. Do this before the
answers come back.

**Never answer the quiz yourself or pre-fill it,** and don't reveal the key if someone asks
mid-quiz. Explain that the value is in their independent judgment. Then stop and wait for the
answers.

The quiz header already explains `none` and `unclear`. Both are findings. An `unclear` means the
distinction couldn't be put into one sentence, and if the quiz can't convey it, the system probably
can't convey it to users either.

## Step 5: Score and analyze

```bash
node .claude/skills/judgment-quiz/scripts/quiz.mjs scenarios.json --score answered.md
node .claude/skills/judgment-quiz/scripts/quiz.mjs scenarios.json --compare pat=pat.md sam=sam.md
```

For the tested-code pathway, re-run the generator's key against the _current_ code first. Then write
the results file (`references/results-template.md`):

- **Group disagreements by what they mean, not by question number.** Five answers can be one finding.
- **Classify each one:**

| Kind                                 | Signal                                                                                           | Next step                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **Category error**                   | The expert rejects every option and writes their own                                             | A concept is missing from the model. Don't just shift a severity |
| **Confirmed defect**                 | A confident answer that differs from the key, with the system erring in the reassuring direction | Highest priority. Check its twin                                 |
| **Principled disagreement**          | The expert's answer fits the system's own stated principles better than the system does          | Usually two concepts conflated in the code                       |
| **Stakeholder conflict**             | Respondents disagree with each other                                                             | Goes to the named decider                                        |
| **Apparent contradiction**           | Two answers from one person that can't both be right                                             | **Ask before changing anything.** Often a misread                |
| **Communication failure**            | A term or sentence was read differently than intended                                            | A wording fix                                                    |
| **Agreement on a deliberate choice** | A match on something designed on purpose                                                         | Record it, so nobody "simplifies" it later                       |

- **For a derived key, confirm a mismatch by observation before calling it a defect.** It may be a
  misreading of the config.

## Step 6: Follow up, then resolve

Run a short follow-up round on contradictions, suspected misreads and `unclear`s: show the two
scenarios side by side and ask which reading they meant. It's common for a "disagreement" to turn out
to be a misread where the system was right, and acting on the first-pass answer would then introduce a
defect.

Then write the resolutions table (finding → decision → who decided → cost). Flag anything that
changes a **contract**: stored data, an API, an export, anything another system parses.

## Step 7: Turn resolved scenarios into feature files

Load the **`feature-files`** skill and give it the resolved scenarios. A quiz scenario is already
Gherkin-shaped:

| Quiz                                                | Feature file                                               |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `prose` + `given:` lines                            | the single `Given` (all scenario-unique setup)             |
| the action the scenario turns on                    | `When`                                                     |
| the **resolved** answer, as the user experiences it | `Then` (stacked at the end if several things are asserted) |
| a boundary or twin pair                             | a `Scenario Outline` with an `Examples` row per side       |
| scenario id + decision label                        | a `# quiz: <id> — <label>` comment above the scenario      |

**Only resolved behavior becomes a feature file.** If you write a `Then` for a disputed or `unclear`
scenario, you've turned a guess into a test that will later look authoritative. Leave those scenarios
in the results file under "Outstanding".

## Step 8: Close the loop

- **Where a system exists**, each finding becomes ordinary work. The new feature file is the failing
  acceptance test, and the fix makes it pass.
- **Where nothing is built yet**, the feature files are the specification. Implement them through the
  starter kit's test layer (`TEST_LAYER_CONVENTIONS.md`).
- Re-render the key after the fixes and confirm that each resolved scenario now produces the agreed
  answer. Keep the quiz. When the logic changes substantially, re-running it with the same answerer is
  cheap.

## Pitfalls

- **Leaking the key** through option order, fluency or length, or prose that echoes one option's
  wording. Read the rendered quiz once as the answerer would.
- **Code vocabulary in the scenarios.** If understanding a scenario requires a variable or config
  key, the question is about the implementation rather than the domain.
- **Testing presentation instead of judgment.** Layout, ordering and truncation are cheap to test
  conventionally and waste the expert's attention.
- **Resolving from a single surprising answer.** Corroborate it with its twin, its neighbors, or a
  follow-up first.
- **Answering on the expert's behalf** because they're slow. A quiz without the expert is not a
  judgment quiz. Send it and wait.
