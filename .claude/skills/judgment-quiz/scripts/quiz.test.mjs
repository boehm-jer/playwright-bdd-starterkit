// node --test .claude/skills/judgment-quiz/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shuffled,
  emitQuiz,
  emitKey,
  emitCoverage,
  parseAnswers,
  emitScore,
  emitCompare,
} from "./quiz.mjs";

const doc = () => ({
  title: "Checkout quiz",
  notTested: "button colours",
  scenarios: [
    {
      id: "A1",
      batch: "A. Discounts",
      prose: "A member buys one item with a coupon.",
      given: ["The coupon has expired."],
      options: {
        APPLY: "The coupon applies.",
        PARTIAL: "Half the discount applies.",
        REJECT: "The coupon is rejected.",
      },
      covers: ["coupon expiry"],
      key: { answer: "REJECT", evidence: "checkout.php:42" },
    },
    {
      id: "A2",
      batch: "A. Discounts",
      prose: "A guest buys one item.",
      options: { FULL: "Full price.", MEMBER: "Member price." },
      covers: ["guest pricing", "coupon expiry"],
    },
  ],
});

// ── Blinding ────────────────────────────────────────────────────────────────────────────────────

test("option order is the hash order: stable, and not declaration order", () => {
  const s = doc().scenarios[0];
  // computed: h = (h*31 + c) % 100003 over 'A1'+code → A1REJECT=58936, A1APPLY=84598, A1PARTIAL=99733
  assert.deepEqual(shuffled(s), ["REJECT", "APPLY", "PARTIAL"]);
  assert.notDeepEqual(shuffled(s), Object.keys(s.options));
  assert.deepEqual(shuffled(s), shuffled(s));
});

test("the quiz never reveals the key, the evidence, the codes, or the coverage labels", () => {
  const q = emitQuiz(doc());
  for (const leak of [
    "REJECT",
    "APPLY",
    "PARTIAL",
    "checkout.php",
    "coupon expiry",
    "guest pricing",
  ]) {
    assert.ok(!q.includes(leak), `quiz leaked "${leak}"`);
  }
});

test("the quiz renders prose, given lines, lettered options in hash order, and an answer block", () => {
  const q = emitQuiz(doc());
  assert.ok(q.includes("# Checkout quiz"));
  assert.ok(q.includes("## A. Discounts"));
  assert.ok(
    q.includes(
      "### A1\n\nA member buys one item with a coupon.\n\n> The coupon has expired.",
    ),
  );
  assert.ok(
    q.includes(
      "- **a.** The coupon is rejected.\n- **b.** The coupon applies.\n- **c.** Half the discount applies.",
    ),
  );
  assert.ok(q.includes("```\nanswer:\nwhy:\n```"));
  assert.ok(q.includes("button colours"));
});

// ── Key ─────────────────────────────────────────────────────────────────────────────────────────

test("the key reports each answer with its letter and evidence, and marks scenarios with no key", () => {
  const k = emitKey(doc());
  assert.ok(k.includes("| A1 | `REJECT` (a) | checkout.php:42 |"));
  assert.ok(k.includes("| A2 | — no key | |"));
  assert.ok(k.includes("Letter distribution: a/1"));
});

// ── Coverage ────────────────────────────────────────────────────────────────────────────────────

test("coverage maps each judgment to its scenarios", () => {
  const c = emitCoverage(doc());
  assert.ok(c.includes("- `coupon expiry` — A1, A2"));
  assert.ok(c.includes("- `guest pricing` — A2"));
  assert.ok(c.includes("2 scenarios covering 2 judgments."));
  assert.ok(!c.includes("⚠"));
});

test("coverage flags a key that is not among its own options", () => {
  const d = doc();
  d.scenarios[0].key.answer = "WAIVE";
  assert.ok(
    emitCoverage(d).includes("⚠") &&
      emitCoverage(d).includes("A1: key is `WAIVE`"),
  );
});

test("coverage flags a scenario with fewer than two options", () => {
  const d = doc();
  d.scenarios[1].options = { FULL: "Full price." };
  assert.ok(emitCoverage(d).includes("A2: only 1 option"));
});

test("coverage flags duplicate scenario ids", () => {
  const d = doc();
  d.scenarios[1].id = "A1";
  assert.ok(emitCoverage(d).includes("duplicate id A1"));
});

// ── Reading answers back ────────────────────────────────────────────────────────────────────────

const filled = [
  "### A1",
  "",
  "prose",
  "",
  "```",
  "answer: A (and also a screenshot)",
  "why: expired is expired",
  "```",
  "",
  "### A2",
  "",
  "prose",
  "",
  "```",
  "answer: none ** guests should see a sign-up prompt",
  "why:",
  "```",
  "",
  "### A3",
  "",
  "```",
  "answer:",
  "why:",
  "```",
  "",
  "### A4",
  "",
  "```",
  "answer: unclear — which currency?",
  "why:",
  "```",
].join("\n");

test("answers are parsed per id: letter (case-insensitive), none, unclear, blank", () => {
  assert.deepEqual(parseAnswers(filled), {
    A1: {
      kind: "letter",
      letter: "a",
      raw: "A (and also a screenshot)",
      why: "expired is expired",
    },
    A2: {
      kind: "none",
      raw: "none ** guests should see a sign-up prompt",
      why: "",
    },
    A3: { kind: "blank", raw: "", why: "" },
    A4: { kind: "unclear", raw: "unclear — which currency?", why: "" },
  });
});

test("the score compares answers to the key and counts only keyed, lettered answers as matches", () => {
  const d = doc();
  const s = emitScore(d, parseAnswers(filled));
  assert.ok(s.includes("**1 of 1 keyed scenarios matched.**"));
  assert.ok(s.includes("| A1 | a — `REJECT` | a — `REJECT` | ✓ |"));
  assert.ok(
    s.includes(
      "| A2 | none ** guests should see a sign-up prompt | — no key | finding |",
    ),
  );
});

test("a wrong letter is a mismatch, reported with both codes", () => {
  const s = emitScore(
    doc(),
    parseAnswers(filled.replace("answer: A", "answer: b")),
  );
  assert.ok(s.includes("**0 of 1 keyed scenarios matched.**"));
  assert.ok(s.includes("| A1 | b — `APPLY` | a — `REJECT` | ✗ |"));
});

// ── Several respondents, no key (the requirements pathway) ──────────────────────────────────────

test("compare lines respondents up per scenario and marks where they disagree", () => {
  const pat = parseAnswers(
    "### A1\n```\nanswer: a\n```\n### A2\n```\nanswer: b\n```",
  );
  const sam = parseAnswers(
    "### A1\n```\nanswer: a\n```\n### A2\n```\nanswer: none ** ask finance\n```",
  );
  const c = emitCompare(doc(), { pat, sam });
  assert.ok(c.includes("| # | pat | sam | |"));
  assert.ok(c.includes("| A1 | a — `REJECT` | a — `REJECT` | agree |"));
  assert.ok(
    c.includes("| A2 | b — `FULL` | none ** ask finance | **disagree** |"),
  );
  assert.ok(c.includes("**1 of 2 scenarios agreed.**"));
});

test("two blank answers are not agreement", () => {
  const blank = parseAnswers("### A1\n```\nanswer:\n```");
  const c = emitCompare(doc(), { pat: blank, sam: blank });
  assert.ok(c.includes("| A1 | — blank | — blank | **disagree** |"));
  assert.ok(c.includes("**0 of 2 scenarios agreed.**"));
});
