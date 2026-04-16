import { expect } from '@playwright/test';
import { createBdd } from "playwright-bdd";
import path from 'path';
import PdfValidationHelpers from '../helpers/pdfValidationHelpers';

const { Given, When, Then } = createBdd();

Given("I am visiting the website", async ({ page }) => {
  await page.goto(`https://commons.wikimedia.org/wiki/File:PDF_metadata.pdf`);
  await expect(page).toHaveTitle(`File:PDF metadata.pdf - Wikimedia Commons`);
  await expect(page.locator(`[aria-label="Loading"]`)).not.toBeInViewport();
});

When("I download the pdf file", async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button').and(page.getByTitle('Download all sizes')).click();
  await page.getByRole('link', { name: 'Full resolution' }).click();
  const download = await downloadPromise;
  await download.saveAs(path.join(process.cwd(), 'downloads', download.suggestedFilename()));
});

Then("the pdf should have the expected content", async ({}) => {
  await PdfValidationHelpers.validateDownloadedPdf('PDF_metadata.pdf', 'contain', ['Testing', 'PDF', 'metadata']);
  await PdfValidationHelpers.validateDownloadedPdf('PDF_metadata.pdf', 'not.contain', ['milk', 'cheese', 'eggs']);
});
