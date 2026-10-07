#!/usr/bin/env node
// A judgment quiz from one scenario table (JSON), in five views. Zero dependencies.
//
//   node quiz.mjs scenarios.json --quiz                     > judgment-quiz.md   # blinded, for the answerer
//   node quiz.mjs scenarios.json --key                                           # the key + letter spread
//   node quiz.mjs scenarios.json --coverage                                      # run BEFORE handing it over
//   node quiz.mjs scenarios.json --score   answered.md                           # one respondent vs the key
//   node quiz.mjs scenarios.json --compare pat=pat.md sam=sam.md                 # respondents vs each other
//
// Use this for the pathways where the key is OBSERVED, DERIVED or ABSENT. When the decision function
// can be called directly, write a project-native generator instead (see
// references/pathway-tested-code.md): there the key must come from executing the code, not from a
// `key` field someone typed.
//
// Scenario table shape:
//   { "title": "...", "notTested": "...",
//     "scenarios": [{ "id": "A1", "batch": "A. ...", "prose": "...", "given": ["..."],
//                     "options": { "CODE": "what the user would see" , ... },
//                     "covers": ["judgment label"],
//                     "key": { "answer": "CODE", "evidence": "where it came from" } }] }   // key optional

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** A simple string hash: stable (regenerating never reshuffles an answered quiz) and arbitrary. */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
}

export const shuffled = (s) =>
  Object.keys(s.options).sort((a, b) => hash(s.id + a) - hash(s.id + b));

const letterOf = (s, code) => {
  const i = shuffled(s).indexOf(code);
  return i < 0 ? null : String.fromCharCode(97 + i);
};
const codeOf = (s, letter) => shuffled(s)[letter.charCodeAt(0) - 97] ?? null;

export function emitQuiz(doc) {
  const out = [
    `# ${doc.title}`,
    "",
    "For each scenario, pick what the system **should** do — not what you think it does today.",
    "",
    "**How to fill it in**",
    "",
    "- Write the letter on the `answer:` line. Add a sentence on `why:` when the reasoning matters, and especially when you nearly picked something else.",
    "- If none of the options is right, write `answer: none` and say what it should be. That is a finding, not a failure of the question.",
    "- If the scenario is missing something you need in order to decide, write `answer: unclear` and say what. That is also a finding — if the distinction cannot be conveyed in a sentence here, the real system probably cannot convey it to a user either.",
    "- The options are deliberately not ordered to hint at anything, and this file does not say which one the system currently produces.",
    "",
  ];
  if (doc.notTested) out.push(`**Not being tested:** ${doc.notTested}`, "");
  let batch = null;
  for (const s of doc.scenarios) {
    if (s.batch && s.batch !== batch) {
      batch = s.batch;
      out.push("---", "", `## ${batch}`, "");
    }
    out.push(`### ${s.id}`, "", s.prose, "");
    if (s.given?.length) out.push(...s.given.map((g) => `> ${g}`), "");
    shuffled(s).forEach((code, i) =>
      out.push(`- **${String.fromCharCode(97 + i)}.** ${s.options[code]}`),
    );
    out.push("", "```", "answer:", "why:", "```", "");
  }
  out.push(
    "---",
    "",
    `_${doc.scenarios.length} scenarios. Generated from the scenario table — edit the table, not this file._`,
    "",
  );
  return out.join("\n");
}

export function emitKey(doc) {
  const out = ["# Key", "", "| # | key (letter) | evidence |", "|---|---|---|"];
  const spread = {};
  for (const s of doc.scenarios) {
    if (!s.key) {
      out.push(`| ${s.id} | — no key | |`);
      continue;
    }
    const l = letterOf(s, s.key.answer) ?? "NOT AN OPTION";
    spread[l] = (spread[l] ?? 0) + 1;
    out.push(
      `| ${s.id} | \`${s.key.answer}\` (${l}) | ${s.key.evidence ?? ""} |`,
    );
  }
  const dist = Object.keys(spread)
    .sort()
    .map((l) => `${l}/${spread[l]}`)
    .join(" ");
  out.push("", `Letter distribution: ${dist || "(no keys)"}`, "");
  return out.join("\n");
}

export function emitCoverage(doc) {
  const seen = new Map();
  for (const s of doc.scenarios)
    for (const c of s.covers ?? []) seen.set(c, [...(seen.get(c) ?? []), s.id]);
  const out = ["# Judgment coverage", ""];
  for (const [j, ids] of [...seen].sort(([a], [b]) => a.localeCompare(b)))
    out.push(`- \`${j}\` — ${ids.join(", ")}`);
  out.push(
    "",
    `${doc.scenarios.length} scenarios covering ${seen.size} judgments.`,
    "",
  );

  const problems = [];
  const ids = new Set();
  for (const s of doc.scenarios) {
    if (ids.has(s.id)) problems.push(`duplicate id ${s.id}`);
    ids.add(s.id);
    const n = Object.keys(s.options).length;
    if (n < 2)
      problems.push(`${s.id}: only ${n} option — nothing to choose between`);
    if (s.key && !(s.key.answer in s.options))
      problems.push(
        `${s.id}: key is \`${s.key.answer}\`, which is not among its options — unanswerable`,
      );
  }
  if (problems.length)
    out.push(
      "## ⚠ Fix before handing the quiz over",
      "",
      ...problems.map((p) => `- ${p}`),
      "",
    );
  return out.join("\n");
}

/** Reads a filled-in quiz back: the first `answer:` / `why:` after each `### <id>` heading. */
export function parseAnswers(text) {
  const answers = {};
  let id = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^###\s+(\S+)/.exec(line);
    if (h) {
      id = h[1];
      continue;
    }
    if (!id) continue;
    const a = /^answer:\s*(.*)$/i.exec(line);
    if (a && !answers[id]) {
      const raw = a[1].trim();
      const letter = /^([a-z])(\W|$)/i.exec(raw);
      if (raw === "") answers[id] = { kind: "blank", raw, why: "" };
      else if (/^none\b/i.test(raw))
        answers[id] = { kind: "none", raw, why: "" };
      else if (/^unclear\b/i.test(raw))
        answers[id] = { kind: "unclear", raw, why: "" };
      else if (letter)
        answers[id] = {
          kind: "letter",
          letter: letter[1].toLowerCase(),
          raw,
          why: "",
        };
      else answers[id] = { kind: "other", raw, why: "" };
      continue;
    }
    const w = /^why:\s*(.*)$/i.exec(line);
    if (w && answers[id] && answers[id].why === "")
      answers[id].why = w[1].trim();
  }
  return answers;
}

const showAnswer = (s, a) => {
  if (!a || a.kind === "blank") return "— blank";
  if (a.kind !== "letter") return a.raw;
  const code = codeOf(s, a.letter);
  return code ? `${a.letter} — \`${code}\`` : `${a.letter} — (no such option)`;
};

export function emitScore(doc, answers) {
  const rows = [];
  let keyed = 0;
  let matched = 0;
  for (const s of doc.scenarios) {
    const a = answers[s.id];
    const key = s.key
      ? `${letterOf(s, s.key.answer)} — \`${s.key.answer}\``
      : "— no key";
    let result = "—";
    if (a && (a.kind === "none" || a.kind === "unclear" || a.kind === "other"))
      result = "finding";
    else if (s.key && a?.kind === "letter")
      result = codeOf(s, a.letter) === s.key.answer ? "✓" : "✗";
    if (s.key) keyed++;
    if (result === "✓") matched++;
    rows.push(`| ${s.id} | ${showAnswer(s, a)} | ${key} | ${result} |`);
  }
  return [
    "# Score",
    "",
    `**${matched} of ${keyed} keyed scenarios matched.**`,
    "",
    "| # | answer | key | |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

export function emitCompare(doc, byRespondent) {
  const names = Object.keys(byRespondent);
  const rows = [];
  let agreed = 0;
  for (const s of doc.scenarios) {
    const shown = names.map((n) => showAnswer(s, byRespondent[n][s.id]));
    const same =
      shown.every((x) => x === shown[0]) &&
      byRespondent[names[0]][s.id]?.kind === "letter";
    if (same) agreed++;
    rows.push(
      `| ${s.id} | ${shown.join(" | ")} | ${same ? "agree" : "**disagree**"} |`,
    );
  }
  return [
    "# Respondents compared",
    "",
    `**${agreed} of ${doc.scenarios.length} scenarios agreed.**`,
    "",
    `| # | ${names.join(" | ")} | |`,
    `|---|${names.map(() => "---|").join("")}---|`,
    ...rows,
    "",
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [file, mode, ...rest] = process.argv.slice(2);
  const usage =
    "usage: quiz.mjs <scenarios.json> --quiz | --key | --coverage | --score <answered.md> | --compare name=file.md ...";
  if (!file || !mode) {
    console.error(usage);
    process.exit(1);
  }
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const read = (p) => parseAnswers(readFileSync(p, "utf8"));
  const views = {
    "--quiz": () => emitQuiz(doc),
    "--key": () => emitKey(doc),
    "--coverage": () => emitCoverage(doc),
    "--score": () => emitScore(doc, read(rest[0])),
    "--compare": () =>
      emitCompare(
        doc,
        Object.fromEntries(
          rest.map((r) => {
            const [n, p] = r.split("=");
            return [n, read(p)];
          }),
        ),
      ),
  };
  if (!views[mode]) {
    console.error(usage);
    process.exit(1);
  }
  process.stdout.write(views[mode]());
}
