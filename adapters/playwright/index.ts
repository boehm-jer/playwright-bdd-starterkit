import { Page } from "@playwright/test";
import { ScenarioContext } from "../../context/ScenarioContext";
import { SampleDsl } from "../../dsl/sampleDsl";
import { SubmitDsl } from "../../dsl/submitDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";
import { PlaywrightAccessibilityDsl } from "./PlaywrightAccessibilityDsl";
import { PlaywrightPdfDownloadDsl } from "./PlaywrightPdfDownloadDsl";
import { PlaywrightVisualRegressionDsl } from "./PlaywrightVisualRegressionDsl";

export function createPlaywrightContext(page: Page): ScenarioContext {
  const browser = new PlaywrightBrowserDsl(page);
  return new ScenarioContext(
    new SampleDsl(browser),
    new PlaywrightAccessibilityDsl(page),
    new PlaywrightPdfDownloadDsl(page),
    new SubmitDsl(browser),
    new PlaywrightVisualRegressionDsl(page),
  );
}
