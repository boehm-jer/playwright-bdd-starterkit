import { test as base } from "playwright-bdd";
import { ScenarioContext } from "./context/ScenarioContext";
import { createPlaywrightContext } from "./adapters/playwright";

export const test = base.extend<{ scenario: ScenarioContext }>({
  // testInfo is Playwright's third fixture argument. It is handed to the adapter so DSLs can
  // annotate the running test through the abstract `annotate` primitive without any layer above
  // adapters/ knowing TestInfo exists.
  scenario: async ({ page }, use, testInfo) => {
    await use(createPlaywrightContext(page, testInfo));
  },
});
