import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures";

const { Given, Then } = createBdd(test);

Given(`I am visiting {string}`, async ({ accessibilityDsl }, website: string) => {
  await accessibilityDsl.navigateTo(website);
});

Then(
  `{string} accessibility checks should pass`,
  async ({ accessibilityDsl }, impact: string) => {
    const violations = await accessibilityDsl.getViolationsAtOrAbove(impact);
    expect(violations).toEqual([]);
  },
);

Then(
  `{string} accessibility checks should fail`,
  async ({ accessibilityDsl }, impact: string) => {
    const violations = await accessibilityDsl.getViolationsAtOrAbove(impact);
    expect(violations.length).toBeGreaterThan(0);
  },
);
