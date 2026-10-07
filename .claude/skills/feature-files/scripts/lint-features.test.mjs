// node --test .claude/skills/feature-files/scripts/
import { test } from "node:test";
import assert from "node:assert/strict";
import { lintFeature } from "./lint-features.mjs";

const feature = (body, tag = "@cart") => `${tag}\nFeature: Cart\n\n${body}\n`;
const messages = (text, file = "cart.feature") =>
  lintFeature(text, file).map((p) => p.message);

// ── Legal shapes: every shape FEATURE_FILE_CONVENTIONS.md lists must pass ──────────────────────

const LEGAL = {
  "Given · Then": ["Given a", "Then b"],
  "Given · Then · Then": ["Given a", "Then b", "Then c"],
  "Given · When · Then": ["Given a", "When b", "Then c"],
  "Given · When · Then · When · Then": [
    "Given a",
    "When b",
    "Then c",
    "When d",
    "Then e",
  ],
  "Given · When · Then · Then": ["Given a", "When b", "Then c", "Then d"],
  "Given · When · Then · When · Then · Then": [
    "Given a",
    "When b",
    "Then c",
    "When d",
    "Then e",
    "Then f",
  ],
};

for (const [shape, steps] of Object.entries(LEGAL)) {
  test(`legal shape passes: ${shape}`, () => {
    const text = feature(
      `  Scenario: s\n${steps.map((s) => `    ${s}`).join("\n")}`,
    );
    assert.deepEqual(lintFeature(text, "cart.feature"), []);
  });
}

// ── Illegal shapes ──────────────────────────────────────────────────────────────────────────────

const ILLEGAL = {
  "no Given at all": [
    ["When a", "Then b"],
    "must start with exactly one Given",
  ],
  "Given not first": [
    ["When a", "Given b", "Then c"],
    "must start with exactly one Given",
  ],
  "two Givens": [["Given a", "Given b", "Then c"], "exactly one Given"],
  "Given only, no assertion": [["Given a"], "must end with a Then"],
  "ends on a When": [
    ["Given a", "When b", "Then c", "When d"],
    "must end with a Then",
  ],
  "mid-scenario stacked Then": [
    ["Given a", "When b", "Then c", "Then d", "When e", "Then f"],
    "stacked Thens are allowed only at the end",
  ],
  "Then before a When (Given · Then · When · Then)": [
    ["Given a", "Then b", "When c", "Then d"],
    "stacked Thens are allowed only at the end",
  ],
  "two Whens in a row": [
    ["Given a", "When b", "When c", "Then d"],
    "When must be followed by a Then",
  ],
};

for (const [name, [steps, expected]] of Object.entries(ILLEGAL)) {
  test(`illegal shape fails: ${name}`, () => {
    const text = feature(
      `  Scenario: s\n${steps.map((s) => `    ${s}`).join("\n")}`,
    );
    const msgs = messages(text);
    assert.equal(
      msgs.length,
      1,
      `expected exactly one problem, got ${JSON.stringify(msgs)}`,
    );
    assert.match(msgs[0], new RegExp(expected));
  });
}

// ── Keywords ────────────────────────────────────────────────────────────────────────────────────

test("And is rejected, with its line number", () => {
  const text = feature(
    "  Scenario: s\n    Given a\n    When b\n    Then c\n    And d",
  );
  const problems = lintFeature(text, "cart.feature");
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /"And" is not allowed/);
  assert.equal(problems[0].line, 8);
});

test("But is rejected", () => {
  assert.match(
    messages(
      feature("  Scenario: s\n    Given a\n    Then b\n    But c"),
    ).join(),
    /"But" is not allowed/,
  );
});

test("the * step bullet is rejected", () => {
  assert.match(
    messages(feature("  Scenario: s\n    Given a\n    * b\n    Then c")).join(),
    /"\*" is not allowed/,
  );
});

test("Background is rejected", () => {
  const text = feature(
    "  Background:\n    Given a\n\n  Scenario: s\n    Given b\n    Then c",
  );
  assert.deepEqual(messages(text), [
    "Background is not allowed — fold its setup into each scenario's Given",
  ]);
});

// ── Tags ────────────────────────────────────────────────────────────────────────────────────────

test("a feature without the @<file name> tag fails", () => {
  const text = feature("  Scenario: s\n    Given a\n    Then b", "@shop");
  assert.deepEqual(messages(text), [
    "Feature must be tagged @cart (matching its file name)",
  ]);
});

test("the file-name tag may sit among other tags", () => {
  const text = feature(
    "  Scenario: s\n    Given a\n    Then b",
    "@smoke @cart",
  );
  assert.deepEqual(messages(text), []);
});

test("the file-name tag is read from the basename, not the path", () => {
  const text = feature("  Scenario: s\n    Given a\n    Then b");
  assert.deepEqual(messages(text, "features/cart/cart.feature"), []);
});

test("@only is rejected wherever it appears", () => {
  const text = feature("  @only\n  Scenario: s\n    Given a\n    Then b");
  assert.deepEqual(messages(text), ["@only must never be committed"]);
});

test("@onlyish is not mistaken for @only", () => {
  const text = feature("  @onlyish\n  Scenario: s\n    Given a\n    Then b");
  assert.deepEqual(messages(text), []);
});

// ── Scenario Outline ────────────────────────────────────────────────────────────────────────────

test("a Scenario Outline with Examples passes, and its table is not read as steps", () => {
  const text = feature(
    '  Scenario Outline: o\n    Given I navigate to "<path>"\n    Then the page returns "<status>"\n\n    Examples:\n      | path | status |\n      | /a   | 200    |',
  );
  assert.deepEqual(messages(text), []);
});

test("a Scenario Outline without Examples fails", () => {
  const text = feature('  Scenario Outline: o\n    Given a "<x>"\n    Then b');
  assert.deepEqual(messages(text), [
    'Scenario Outline "o" has no Examples table',
  ]);
});

// ── Things that are not steps ───────────────────────────────────────────────────────────────────

test("comments, data tables and doc strings are ignored", () => {
  const text = feature(
    '  # quiz: B7 — a charge that never reached the provider\n  Scenario: s\n    Given a page with:\n      | And | But |\n    Then the body is\n      """\n      And this is not a step\n      When neither is this\n      """',
  );
  assert.deepEqual(messages(text), []);
});

test("each scenario is checked independently", () => {
  const text = feature(
    "  Scenario: good\n    Given a\n    Then b\n\n  Scenario: bad\n    When a\n    Then b",
  );
  const problems = lintFeature(text, "cart.feature");
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /"bad"/);
});

test('"Example:" is treated as a scenario keyword', () => {
  const text = feature("  Example: e\n    When a\n    Then b");
  assert.match(messages(text).join(), /"e" must start with exactly one Given/);
});

test('"Example:" is a plain scenario, not an outline — it needs no Examples table', () => {
  const text = feature("  Example: e\n    Given a\n    Then b");
  assert.deepEqual(messages(text), []);
});
