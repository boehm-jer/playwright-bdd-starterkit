import { createBdd } from "playwright-bdd";
import { test } from "../fixtures";

const { Given, When, Then } = createBdd(test);

Given("I am visiting the website", async ({ pdfDownloadDsl }) => {
  await pdfDownloadDsl.visitWikimediaPage();
});

When("I download the pdf file", async ({ pdfDownloadDsl }) => {
  await pdfDownloadDsl.downloadPdf();
});

Then("the pdf should have the expected content", async ({ pdfDownloadDsl }) => {
  await pdfDownloadDsl.validatePdfContent();
});
