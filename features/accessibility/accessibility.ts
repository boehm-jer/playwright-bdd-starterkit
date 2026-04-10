import { createBdd } from "playwright-bdd";
import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import { assertValidImpactValue, violationsAtOrAbove } from "../../helpers/accessibilityImpactHelpers.ts";

const { Given, Then } = createBdd();

Given(`I am visiting {string}`, async ({ page }, website: string) => {
  await page.goto(`https://${website}`);
});

Then(
  `{string} accessibility checks should pass`,
  async ({ page }, impact: string) => {
    assertValidImpactValue(impact);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const failing = violations.filter(violationsAtOrAbove(impact));

    expect(failing).toEqual([]);
  },
);

Then(
  `{string} accessibility checks should fail`,
  async ({ page }, impact: string) => {
    assertValidImpactValue(impact);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const failing = violations.filter(violationsAtOrAbove(impact));

    expect(failing.length).toBeGreaterThan(0);
  },
);
