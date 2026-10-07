import { Page, TestInfo } from "@playwright/test";
import { ScenarioContext } from "../../context/ScenarioContext";
import { SampleDsl } from "../../dsl/sampleDsl";
import { SubmitDsl } from "../../dsl/submitDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";
import { PlaywrightAccessibilityDsl } from "./PlaywrightAccessibilityDsl";
import { PlaywrightPdfDownloadDsl } from "./PlaywrightPdfDownloadDsl";
import { PlaywrightVisualRegressionDsl } from "./PlaywrightVisualRegressionDsl";

/**
 * `testInfo` is threaded in for the same reason `page` is: it is driver-specific, so it stops
 * here and reaches the DSLs only through the abstract `annotate` primitive.
 */
export function createPlaywrightContext(page: Page, testInfo: TestInfo): ScenarioContext {
  const browser = new PlaywrightBrowserDsl(page, testInfo);
  return new ScenarioContext(
    new SampleDsl(browser),
    new PlaywrightAccessibilityDsl(page, testInfo),
    new PlaywrightPdfDownloadDsl(page, testInfo),
    new SubmitDsl(browser),
    new PlaywrightVisualRegressionDsl(page, testInfo),
  );
}
