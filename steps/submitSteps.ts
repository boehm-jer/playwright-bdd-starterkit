import { createBdd } from "playwright-bdd";
import { test } from "../fixtures";

const { Given, When, Then } = createBdd(test);

Given("I am on the submission page", async ({ submitDsl }) => {
  await submitDsl.navigateToSubmissionPage();
});

When("I enter the coupon code {string}", async ({ submitDsl }, text: string) => {
  await submitDsl.enterText(text);
});

Then("the page should confirm a successful form submission", async ({ submitDsl }) => {
  await submitDsl.verifySuccessfulSubmission();
});
