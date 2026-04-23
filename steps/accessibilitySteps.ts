import { Given, Then } from "../support/bdd";
import { expect } from "@playwright/test";

Given("I am visiting {string}", async ({ scenario }, website: string) => {
  await scenario.accessibility.navigateTo(website);
});

Then("{string} accessibility checks should pass", async ({ scenario }, impact: string) => {
  const violations = await scenario.accessibility.getViolationsAtOrAbove(impact);
  expect(violations).toEqual([]);
});

Then("{string} accessibility checks should fail", async ({ scenario }, impact: string) => {
  const violations = await scenario.accessibility.getViolationsAtOrAbove(impact);
  expect(violations.length).toBeGreaterThan(0);
});
