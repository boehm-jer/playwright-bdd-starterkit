import { Given, When, Then } from "../support/bdd";
import { expect } from "@playwright/test";

Given("I am on home page", async ({ scenario }) => {
  await scenario.sample.goToHomePage();
});

When("I click link {string}", async ({ scenario }, linkName: string) => {
  await scenario.sample.clickLink(linkName);
});

Then("the page title should contain {string}", async ({ scenario }, keyword: string) => {
  const title = await scenario.sample.getTitle();
  expect(title).toContain(keyword);
});
