import { Given, When, Then } from "../support/bdd";

Given("I am visiting the website", async ({ scenario }) => {
  await scenario.pdfDownload.visitWikimediaPage();
  await scenario.pdfDownload.verifyPageLoaded();
});

When("I download the pdf file", async ({ scenario }) => {
  await scenario.pdfDownload.downloadPdf();
});

Then("the pdf should have the expected content", async ({ scenario }) => {
  await scenario.pdfDownload.validatePdfContent();
});
