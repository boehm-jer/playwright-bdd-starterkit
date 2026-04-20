import { Page, expect } from "@playwright/test";

export class SampleDsl {
  constructor(private page: Page) {}

  async goToHomePage() {
    await this.page.goto("https://playwright.dev");
  }

  async clickLink(linkName: string) {
    await this.page.getByRole("link", { name: linkName }).click();
  }

  async verifyTitleContains(keyword: string) {
    await expect(this.page).toHaveTitle(new RegExp(keyword));
  }
}
