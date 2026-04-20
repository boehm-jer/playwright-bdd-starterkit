import { Page, expect } from "@playwright/test";

export class SubmitDsl {
  constructor(private page: Page) {}

  async navigateToSubmissionPage() {
    await this.page.goto("https://example.cypress.io/commands/actions");
  }

  async enterText(text: string) {
    await this.page.getByLabel("Coupon Code").scrollIntoViewIfNeeded();
    await this.page.getByLabel("Coupon Code").fill(text);
    await this.page.keyboard.press("Enter");
  }

  async verifySuccessfulSubmission() {
    const locator = this.page
      .locator(".well")
      .filter({ has: this.page.locator("form.action-form") })
      .getByText("Your form has been submitted!");
    await expect(locator).toBeVisible();
  }
}
