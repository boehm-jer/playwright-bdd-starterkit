import { Page, expect } from "@playwright/test";
import path from "path";
import { validateDownloadedPdf } from "../helpers/pdfValidationHelpers";

export class PdfDownloadDsl {
  private downloadedFilename = "";

  constructor(private page: Page) {}

  async visitWikimediaPage() {
    await this.page.goto("https://commons.wikimedia.org/wiki/File:PDF_metadata.pdf");
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveTitle("File:PDF metadata.pdf - Wikimedia Commons");
    await expect(this.page.locator('[aria-label="Loading"]')).not.toBeInViewport();
  }

  async downloadPdf() {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.getByRole("button").and(this.page.getByTitle("Download all sizes")).click();
    await this.page.getByRole("link", { name: "Full resolution" }).click();
    const download = await downloadPromise;
    this.downloadedFilename = download.suggestedFilename();
    await download.saveAs(path.join(process.cwd(), "downloads", this.downloadedFilename));
  }

  async validatePdfContent() {
    await validateDownloadedPdf(this.downloadedFilename, "contain", ["Testing", "PDF", "metadata"]);
    await validateDownloadedPdf(this.downloadedFilename, "not.contain", ["milk", "cheese", "eggs"]);
  }
}
