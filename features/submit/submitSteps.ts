import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am on the submission page", async ({ page }) => {
  await page.goto("https://example.cypress.io/commands/actions");
});

When("I enter my valid text {string}", async ({ page }, text: string) => {
  await page.getByTestId(`couponCode1`).fill(text);
  await page.keyboard.press("Enter");
});

Then("the page should confirm a successful form submission", async ({ page }) => {
  await expect(page.getByText("Your form has been submitted!")).toBeVisible();
});
