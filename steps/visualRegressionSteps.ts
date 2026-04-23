import { Given, When, Then } from "../support/bdd";

Given("I navigate to the example.com homepage", async ({ scenario }) => {
  await scenario.visualRegression.navigateToExampleCom();
});

When("I capture a full-page screenshot named {string}", async ({ scenario }, name: string) => {
  await scenario.visualRegression.setScreenshotName(name);
});

Then("the screenshot should match the visual baseline", async ({ scenario }) => {
  await scenario.visualRegression.compareWithBaseline();
});
