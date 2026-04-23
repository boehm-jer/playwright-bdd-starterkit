import { Given, When, Then } from "../support/bdd";
import { expect } from "@playwright/test";

Given("I am on the submission page", async ({ scenario }) => {
  await scenario.submit.navigateToSubmissionPage();
});

When("I enter the coupon code {string}", async ({ scenario }, text: string) => {
  await scenario.submit.enterText(text);
});

Then("the page should confirm a successful form submission", async ({ scenario }) => {
  const confirmed = await scenario.submit.isSubmissionConfirmed();
  expect(confirmed).toBe(true);
});
