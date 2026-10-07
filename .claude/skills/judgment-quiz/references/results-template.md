# Results file template

Save as `docs/<name>-quiz-results.md` next to the quiz. Group findings by meaning, not by question
order. Lead with the resolutions so a reader who stops after the first screen still knows what was
decided.

```markdown
# <Name> quiz — results

**N of M matched** (after the follow-up round; K on first pass — <IDs> were misreads and the code was
right). Disagreements are grouped below by what they mean, not by question order.

## Resolutions — decided, and what each costs

| Finding                       | Decision             | Work                                  |
| ----------------------------- | -------------------- | ------------------------------------- |
| §1 <IDs> — <one-line finding> | **Implement** <what> | <scope; flag schema/contract changes> |
| §4 <IDs> — <finding>          | **No change.** <why> | none                                  |
| §5 <ID> — <finding>           | open, minor          | wording                               |

<If one change resolves several findings, show it as a table of situation → today → after → expert's
answer, so the reader can see that all three land.>

## Contract decisions, flagged rather than buried

<Anything that changes an exported output, a stored schema, or something downstream consumers parse.
State what stays populated and what changes shape.>

The answer key was produced by executing `<decision function>` (`<script> --actual`), so "CODE" below
is measured, not recalled.

---

## 1. <Biggest finding — usually a category error or a defect in the reassuring direction>

**<IDs>** — <expert answer, quoted verbatim when they wrote their own>. The code says <code answer>.

<Why the code does this (name the function and the condition), and why it's wrong. If it's a
category error, explain the missing concept rather than the mis-set severity.>

## 2. <Confirmed defect>

## 3. <Calibration / principled disagreements>

| Q   | Situation | Expert | Code |
| --- | --------- | ------ | ---- |

## 4. <Apparent contradictions — what needs resolving before touching anything>

## 5. <Communication failures — wording, not logic>

## 6. Agreements worth recording, because they validate deliberate choices

- <IDs> — <what was confirmed>

## 7. Cross-cutting requests

<Things the expert noted across several answers that are not about the decision itself, such as
"include the PR link".>

## 8. Outstanding

- <blank answers, `unclear`s, things still to check>
```
