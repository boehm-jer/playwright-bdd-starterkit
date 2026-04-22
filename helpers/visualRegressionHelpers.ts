import { Page, expect, Locator } from "@playwright/test";

interface ScreenshotOptions {
  maxDiffPixelRatio?: number;
  threshold?: number;
  mask?: string[];
}

export async function compareScreenshot(
  page: Page,
  snapshotName: string,
  options: ScreenshotOptions = {}
): Promise<void> {
  const { maxDiffPixelRatio = 0.01, threshold = 0.2, mask = [] } = options;
  const maskLocators: Locator[] = mask.map((selector) => page.locator(selector));

  await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
    fullPage: true,
    animations: "disabled",
    maxDiffPixelRatio,
    threshold,
    ...(maskLocators.length > 0 && { mask: maskLocators }),
  });
}
