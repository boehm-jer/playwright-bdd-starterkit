# Pathway: tested code

**Use when** the judgment layer is a function you can call with synthetic inputs, ideally one the unit
tests already call. This is the strongest pathway, because the key is produced by **executing the
real code** over the exact scenario objects the quiz is rendered from. Nobody, including you, gets to
type the key.

**How you find the decisions:** read the decision function and everything it calls. Every mapping
table, precedence list, override, threshold and early return is a candidate (see SKILL.md step 1).

**How you produce the key:** write a project-native generator, sketched below. Don't use the bundled
`scripts/quiz.mjs` with a hand-typed `key` field here. If the code can be run, running it is the only
acceptable key.

**Confidence:** high. The key is what the code does today, by construction.

## Generator template

A skeleton of a quiz generator, cut down to its structure. Port
it to the project's language. The parts worth keeping exactly are: one scenario table, the hash-based
option order, the key computed by calling the real function, and the coverage check that flags
unanswerable questions.

Replace `decide`, `Inputs`, `Outcome` and `render` with the project's own decision function, its input
type, its output code type, and the way an output is shown to a real user.

````ts
// scripts/judgment-quiz.ts
//
//   npx tsx scripts/judgment-quiz.ts --quiz     > docs/judgment-quiz.md   # blinded, for the answerer
//   npx tsx scripts/judgment-quiz.ts --actual                             # what the code says today
//   npx tsx scripts/judgment-quiz.ts --coverage                           # judgments ↔ scenarios
//
// Two load-bearing rules:
//   1. BLINDED: option order comes from a hash of (id + code); the file never marks the real answer.
//   2. EXECUTED KEY: --actual runs the real decision function over the SAME scenario objects.

import { decide, type Inputs, type Outcome } from "../src/decide"; // the judgment layer
import { render } from "../src/render"; // what a user actually sees
import { inputs /*, other fixtures */ } from "../tests/fixtures"; // SAME fixtures as unit tests

interface Scenario {
  id: string; // 'A1', 'B7' …
  batch: string; // section heading, e.g. 'B. Payment failures'
  prose: string; // operational language, no code terms
  given?: string[]; // facts the prose leaves ambiguous
  build: () => Inputs; // constructed exactly as a unit test would
  options: Outcome[]; // 3–4 plausible codes; exactly one is what `decide` returns
  covers: string[]; // judgment labels — never shown in the quiz
}

const SCENARIOS: Scenario[] = [
  {
    id: "A1",
    batch: "A. New and imported members",
    prose:
      "A member joined yesterday and paid by card. The payment has not settled yet …",
    build: () => inputs({ joinedDaysAgo: 1, payment: "pending" }),
    options: ["ACTIVE", "NEEDS_ATTENTION", "LAPSED", "PENDING"],
    covers: ["STATUS_FOR_PAYMENT.pending"],
  },
  // … one per judgment, plus boundary / precedence pairs, plus identical-input twins
];

// ── Blinding ────────────────────────────────────────────────────────────────────────────
// It must be stable, so regenerating doesn't reshuffle an answered quiz, and arbitrary, so the
// real answer spreads across positions.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
}
const shuffled = (s: Scenario) =>
  [...s.options].sort((a, b) => hash(s.id + a) - hash(s.id + b));
const letter = (i: number) => String.fromCharCode(97 + i);

// ── Views ───────────────────────────────────────────────────────────────────────────────
function emitQuiz(): string {
  const out = [
    "# The judgment quiz",
    "",
    "For each scenario, pick what the system **should** do — not what you think it does.",
    "",
    "- Write the letter on `answer:`; add a sentence on `why:`, especially if you nearly picked another.",
    "- `answer: none` + what it should be is a finding, not a failure of the question.",
    "- `answer: unclear` + what is missing is also a finding.",
    "- Options are not ordered to hint at anything; this file does not say which one the code produces.",
    "",
    "**Not being tested:** <rendering details that are out of scope>.",
    "",
  ];
  let batch = "";
  for (const s of SCENARIOS) {
    if (s.batch !== batch) {
      batch = s.batch;
      out.push("---", "", `## ${batch}`, "");
    }
    out.push(`### ${s.id}`, "", s.prose, "");
    if (s.given?.length) {
      s.given.forEach((g) => out.push(`> ${g}`));
      out.push("");
    }
    shuffled(s).forEach((code, i) =>
      out.push(`- **${letter(i)}.** ${render(code)}`),
    );
    out.push("", "```", "answer:", "why:", "```", "");
  }
  out.push(
    "---",
    "",
    `_${SCENARIOS.length} scenarios. Generated — edit the script, not this file._`,
    "",
  );
  return out.join("\n");
}

function emitActual(): string {
  const out = [
    "# What the code actually says",
    "",
    "_Produced by execution, not recollection._",
    "",
    "| # | outcome (letter) |",
    "|---|---|",
  ];
  const dist: Record<string, number> = {};
  for (const s of SCENARIOS) {
    const actual = decide(s.build());
    const i = shuffled(s).indexOf(actual);
    const l = i >= 0 ? letter(i) : "— NOT AN OPTION";
    dist[l] = (dist[l] ?? 0) + 1;
    out.push(`| ${s.id} | \`${actual}\` (${l}) |`);
  }
  out.push("", `Letter distribution: ${JSON.stringify(dist)}`, "");
  return out.join("\n");
}

function emitCoverage(): string {
  const seen = new Map<string, string[]>();
  for (const s of SCENARIOS)
    for (const c of s.covers) seen.set(c, [...(seen.get(c) ?? []), s.id]);
  const out = ["# Judgment coverage", ""];
  for (const [j, ids] of [...seen].sort())
    out.push(`- \`${j}\` — ${ids.join(", ")}`);
  out.push(
    "",
    `${SCENARIOS.length} scenarios covering ${seen.size} judgments.`,
    "",
  );
  const broken = SCENARIOS.filter(
    (s) => !s.options.includes(decide(s.build())),
  );
  if (broken.length) {
    out.push(
      "## ⚠ Real answer NOT among the options (unanswerable — fix before shipping)",
      "",
    );
    for (const s of broken)
      out.push(`- ${s.id}: code says \`${decide(s.build())}\``);
  }
  return out.join("\n");
}

const mode = process.argv[2] ?? "--quiz";
const views: Record<string, () => string> = {
  "--quiz": emitQuiz,
  "--actual": emitActual,
  "--coverage": emitCoverage,
};
if (!views[mode]) {
  console.error("usage: [--quiz|--actual|--coverage]");
  process.exit(1);
}
process.stdout.write(views[mode]());
````

## Notes on porting

- **Python:** use a `dataclass` for `Scenario`, `build` as a lambda, and pytest fixtures or factory
  functions for inputs. Same hash. Use `argparse` for the three modes.
- **PHP / Drupal:** a Drush command or a plain PHP CLI script works. Build inputs with the factories
  the PHPUnit tests already use.
- **If the decision function is hard to call in isolation**, that is a finding in its own right. A
  judgment layer you can't run on synthetic inputs can't be unit-tested either. Extracting a pure
  `decide(inputs)` is often worth doing before the quiz.
- **Rendering an option:** show the code exactly as the end user receives it (label, glyph, headline,
  sentence) and include every clause the real output would carry, even when that seems to leak a
  little. An option that differs from the real output is worse than one that's slightly suggestive.
