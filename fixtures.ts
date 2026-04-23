import { test as base } from "playwright-bdd";
import { ScenarioContext } from "./context/ScenarioContext";
import { createPlaywrightContext } from "./adapters/playwright";

export const test = base.extend<{ scenario: ScenarioContext }>({
  scenario: async ({ page }, use) => {
    await use(createPlaywrightContext(page));
  },
});
