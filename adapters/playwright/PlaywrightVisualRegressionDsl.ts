import { expect } from "@playwright/test";
import { VisualRegressionDsl } from "../../dsl/visualRegressionDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";
import { compareScreenshot } from "../../helpers/visualRegressionHelpers";

export class PlaywrightVisualRegressionDsl extends PlaywrightBrowserDsl implements VisualRegressionDsl {
  private pendingScreenshotName = "";

  async navigateToExampleCom(): Promise<void> {
    await this.page.goto("https://example.com");
    await expect(this.page).toHaveTitle("Example Domain");
  }

  async setScreenshotName(name: string): Promise<void> {
    this.pendingScreenshotName = name;
  }

  async compareWithBaseline(): Promise<void> {
    await compareScreenshot(this.page, this.pendingScreenshotName);
  }
}
