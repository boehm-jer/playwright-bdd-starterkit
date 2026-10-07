# Pathway: requirements only (no system yet, or none you trust)

**Use when** you are pinning down behavior _before_ it is built: a new feature, a redesign, an RFP,
or a rebuild whose old system nobody wants to copy. It also applies when the existing system is so
far from what anyone intended that its behavior isn't worth keying against.

**There is no answer key, and that changes the game.** You can't measure the expert against the
system. Instead you measure:

- **the expert against the written requirements:** does what they choose match what the ticket or
  SOW says?
- **stakeholders against each other.** Give the same quiz to two or three people separately: the
  client's product owner, Proven's PM, the subject-matter expert. Their disagreements are usually
  the most valuable output of the whole exercise, because each one is a decision that would otherwise
  have been made silently by whoever wrote the code.

## Finding the decisions

Collect every source that states or implies a rule: tickets (Jira, Asana, Teamwork), the SOW and
proposals, Figma annotations, meeting transcripts and notes (Fathom, Granola), and emails. Use the
connected tools when they're available. Then extract:

1. **Every rule-like statement** ("members get free shipping", "editors can't publish"). Each is a
   decision, and each has edges the statement doesn't cover. What about a member whose membership
   lapsed yesterday? An editor who is also an admin?
2. **Every gap.** These are states the sources never mention but the system will certainly reach:
   empty states, expiry, partial failure, the second time something happens, two rules that both
   apply. Gaps make the best questions, because no one has decided them yet.
3. **Every conflict** between sources. Turn each one into a scenario whose options include each
   source's answer, _without attributing them_.

If there are too few written sources to work from, run an interview first (the `sme-interviewer`
skill, if available) and treat its transcript as a source.

## Writing the options

The options are competing **readings** rather than competing system outputs. Each option is
something a reasonable reader of the requirements might conclude, written as what the end user
would see. Include "the requirement is silent and we'd show nothing special" as an option wherever
that's a real possibility. Blinding still applies: never hint which option came from which document
or person.

## Running it

Leave out the `key` field, or set it only where one written requirement is explicit and you want to
test whether the expert agrees with it (cite the source in `evidence`). Then:

```bash
node quiz.mjs scenarios.json --coverage
node quiz.mjs scenarios.json --quiz > quiz.md            # send the same file to each respondent
node quiz.mjs scenarios.json --compare pat=pat.md sam=sam.md
node quiz.mjs scenarios.json --score pat.md              # only meaningful where a key was set
```

## Resolving

Each disagreement needs **one accountable decider**. Name that person when you hand the quiz out,
not after the answers come back. Record each decision and who made it in the results file. Resolved
scenarios become feature files (SKILL.md step 7). Those feature files are the agreed specification
for building the feature, and later its acceptance tests.
