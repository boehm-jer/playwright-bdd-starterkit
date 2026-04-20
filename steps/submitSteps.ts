import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am on the submission page", async ({ page }) => {
  console.log("Given step starting...");
  await page.goto("https://example.cypress.io/commands/actions");
  console.log("Given step ending...");
});

When("I enter my valid text {string}", async ({ page }, text: string) => {
  await page.getByLabel(`Coupon Code`).scrollIntoViewIfNeeded();
  await page.getByLabel(`Coupon Code`).fill(text);
  await page.keyboard.press("Enter");
});

Then(
  "the page should confirm a successful form submission",
  async ({ page }) => {
    let locator = page
      .locator(".well")
      .filter({ has: page.locator("form.action-form") })
      .getByText("Your form has been submitted!");
    await expect(locator).toBeVisible();
  },
);
