import { createBdd } from "playwright-bdd";
import { test } from "../fixtures";

const { Given, When, Then } = createBdd(test);

Given("I navigate to the example.com homepage", async ({ visualRegressionDsl }) => {
  await visualRegressionDsl.navigateToExampleCom();
});

When("I capture a full-page screenshot named {string}", async ({ visualRegressionDsl }, name: string) => {
  await visualRegressionDsl.setScreenshotName(name);
});

Then("the screenshot should match the visual baseline", async ({ visualRegressionDsl }) => {
  await visualRegressionDsl.compareWithBaseline();
});
