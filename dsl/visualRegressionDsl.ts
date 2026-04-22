import { Page, expect } from "@playwright/test";
import { compareScreenshot } from "../helpers/visualRegressionHelpers";

export class VisualRegressionDsl {
  private pendingScreenshotName: string = "";

  constructor(private page: Page) {}

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
