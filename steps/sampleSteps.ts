import { createBdd } from "playwright-bdd";
import { test } from "../fixtures";

const { Given, When, Then } = createBdd(test);

Given("I am on home page", async ({ sampleDsl }) => {
  await sampleDsl.goToHomePage();
});

When("I click link {string}", async ({ sampleDsl }, linkName: string) => {
  await sampleDsl.clickLink(linkName);
});

Then("the page title should contain {string}", async ({ sampleDsl }, keyword: string) => {
  await sampleDsl.verifyTitleContains(keyword);
});
