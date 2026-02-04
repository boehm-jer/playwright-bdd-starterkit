import { createBdd } from "playwright-bdd";
import AxeBuilder from "@axe-core/playwright";
import { expect, Page } from "@playwright/test";
import { axeCoreTag } from "../../helpers/e2eTypeDefinitions.ts";

const { Given, Then } = createBdd();

Given(`I am visiting {string}`, async ({ page }, website: string) => {
  await page.goto(`https://${website}`);
});

Then(
  `{string} accessibility checks should pass`,
  async ({ page }, benchmark: axeCoreTag) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([benchmark])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  },
);
Then(
  `{string} accessibility checks should fail`,
  async ({ page }, benchmark: axeCoreTag) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags([benchmark])
      .analyze();
    
    //TODO: Ensure the checks fail
      expect(accessibilityScanResults.violations).toEqual([]);
    // expect(accessibilityScanResults.violations).toThrowError;
  },
);
