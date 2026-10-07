#!/usr/bin/env node
// Checks .feature files against the keyword grammar in FEATURE_FILE_CONVENTIONS.md.
//
//   node .claude/skills/feature-files/scripts/lint-features.mjs                 # every features/**/*.feature
//   node .claude/skills/feature-files/scripts/lint-features.mjs a.feature ...   # specific files
//
// FEATURE_FILE_CONVENTIONS.md is the authority; this enforces only its mechanical rules (keywords,
// the one Given, the legal scenario shapes, the file-name tag, @only). Whether a step describes intent
// rather than browser mechanics is a judgment no linter can make. If the doc's rules change, change
// this script and its tests in the same commit.
//
// Zero dependencies, so it runs in any project copied from the starter kit without an install.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCENARIO =
  /^(Scenario Outline|Scenario Template|Scenario|Example):\s*(.*)$/;
const STEP = /^(Given|When|Then|And|But|\*)(\s|$)/;
const DISALLOWED = new Set(["And", "But", "*"]);

/**
 * @param {string} text  the .feature file's contents
 * @param {string} file  its path; only the basename is used, for the @<name> tag rule
 * @returns {{line: number, message: string}[]}
 */
export function lintFeature(text, file) {
  const problems = [];
  const report = (line, message) => problems.push({ line, message });

  const featureName = basename(file).replace(/\.feature$/, "");
  const featureTags = [];
  let seenFeature = false;
  let inDocString = null; // the fence that opened it: """ or ```
  let scenario = null;
  const scenarios = [];

  const lines = text.split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = i + 1;
    const t = raw.trim();

    if (inDocString) {
      if (t.startsWith(inDocString)) inDocString = null;
      return;
    }
    if (t.startsWith('"""') || t.startsWith("```")) {
      inDocString = t.slice(0, 3);
      return;
    }
    if (t === "" || t.startsWith("#") || t.startsWith("|")) return;

    if (t.startsWith("@")) {
      if (/(^|\s)@only(\s|$)/.test(t))
        report(line, "@only must never be committed");
      if (!seenFeature) featureTags.push(...t.split(/\s+/));
      return;
    }
    if (t.startsWith("Feature:")) {
      seenFeature = true;
      return;
    }
    if (t.startsWith("Background:")) {
      report(
        line,
        "Background is not allowed — fold its setup into each scenario's Given",
      );
      scenario = null; // its steps belong to no scenario
      return;
    }
    if (t.startsWith("Rule:")) return;
    if (/^(Examples|Scenarios):/.test(t)) {
      if (scenario) scenario.hasExamples = true;
      return;
    }

    const s = SCENARIO.exec(t);
    if (s) {
      scenario = {
        name: s[2],
        line,
        outline: s[1] !== "Scenario" && s[1] !== "Example",
        hasExamples: false,
        steps: [],
      };
      scenarios.push(scenario);
      return;
    }

    const step = STEP.exec(t);
    if (step) {
      const keyword = step[1];
      if (DISALLOWED.has(keyword)) {
        report(
          line,
          `"${keyword}" is not allowed — use only Given, When and Then`,
        );
        return;
      }
      if (scenario) scenario.steps.push({ keyword, line });
    }
  });

  if (!featureTags.includes(`@${featureName}`)) {
    report(
      1,
      `Feature must be tagged @${featureName} (matching its file name)`,
    );
  }

  for (const sc of scenarios) {
    const problem = shapeProblem(sc);
    if (problem)
      report(problem.line, `Scenario "${sc.name}" ${problem.message}`);
    if (sc.outline && !sc.hasExamples) {
      report(sc.line, `Scenario Outline "${sc.name}" has no Examples table`);
    }
  }

  return problems.sort((a, b) => a.line - b.line);
}

/**
 * The legal shapes are exactly: Given, then (When Then)*, then Then*, ending on a Then.
 * Returns the first violation, so one mistake yields one message.
 */
function shapeProblem({ steps, line }) {
  const [first, ...rest] = steps;
  if (!first || first.keyword !== "Given") {
    return {
      line: first?.line ?? line,
      message: "must start with exactly one Given",
    };
  }
  const extraGiven = rest.find((s) => s.keyword === "Given");
  if (extraGiven) {
    return {
      line: extraGiven.line,
      message:
        "has a second Given — exactly one Given is allowed, and it comes first",
    };
  }

  let i = 0;
  while (rest[i]?.keyword === "When") {
    const next = rest[i + 1];
    if (!next) return { line: rest[i].line, message: "must end with a Then" };
    if (next.keyword !== "Then")
      return {
        line: next.line,
        message:
          "has a When that is not followed by a Then — When must be followed by a Then",
      };
    i += 2;
  }
  const strayWhen = rest.slice(i).find((s) => s.keyword === "When");
  if (strayWhen) {
    return {
      line: strayWhen.line,
      message:
        "has a When after consecutive Thens — stacked Thens are allowed only at the end",
    };
  }
  if (rest.length === 0) return { line, message: "must end with a Then" };
  return null;
}

function featureFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return featureFiles(path);
    return path.endsWith(".feature") ? [path] : [];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files =
    process.argv.length > 2 ? process.argv.slice(2) : featureFiles("features");
  let count = 0;
  for (const file of files) {
    for (const p of lintFeature(readFileSync(file, "utf8"), file)) {
      console.log(`${file}:${p.line}: ${p.message}`);
      count++;
    }
  }
  console.log(
    count === 0
      ? `✓ ${files.length} feature file(s) follow the conventions`
      : `✗ ${count} problem(s)`,
  );
  process.exit(count === 0 ? 0 : 1);
}
