import { Page, expect } from "@playwright/test";
import path from "path";
import PdfValidationHelpers from "../helpers/pdfValidationHelpers";

export class PdfDownloadDsl {
  constructor(private page: Page) {}

  async visitWikimediaPage() {
    await this.page.goto("https://commons.wikimedia.org/wiki/File:PDF_metadata.pdf");
    await expect(this.page).toHaveTitle("File:PDF metadata.pdf - Wikimedia Commons");
    await expect(this.page.locator('[aria-label="Loading"]')).not.toBeInViewport();
  }

  async downloadPdf() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.getByRole("button").and(this.page.getByTitle("Download all sizes")).click();
    await this.page.getByRole("link", { name: "Full resolution" }).click();
    const download = await downloadPromise;
    await download.saveAs(path.join(process.cwd(), "downloads", download.suggestedFilename()));
  }

  async validatePdfContent() {
    await PdfValidationHelpers.validateDownloadedPdf("PDF_metadata.pdf", "contain", ["Testing", "PDF", "metadata"]);
    await PdfValidationHelpers.validateDownloadedPdf("PDF_metadata.pdf", "not.contain", ["milk", "cheese", "eggs"]);
  }
}
