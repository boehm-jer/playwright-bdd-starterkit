import { expect } from "@playwright/test";
import path from "path";
import { PdfDownloadDsl } from "../../dsl/pdfDownloadDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";
import { validateDownloadedPdf } from "../../helpers/pdfValidationHelpers";

export class PlaywrightPdfDownloadDsl extends PlaywrightBrowserDsl implements PdfDownloadDsl {
  private downloadedFilename = "";

  async visitWikimediaPage(): Promise<void> {
    await this.page.goto("https://commons.wikimedia.org/wiki/File:PDF_metadata.pdf");
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle("File:PDF metadata.pdf - Wikimedia Commons");
    await expect(this.page.locator('[aria-label="Loading"]')).not.toBeInViewport();
  }

  async downloadPdf(): Promise<void> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.page.getByRole("button").and(this.page.getByTitle("Download all sizes")).click();
    await this.page.getByRole("link", { name: "Full resolution" }).click();
    const download = await downloadPromise;
    this.downloadedFilename = download.suggestedFilename();
    await download.saveAs(path.join(process.cwd(), "downloads", this.downloadedFilename));
  }

  async validatePdfContent(): Promise<void> {
    await validateDownloadedPdf(this.downloadedFilename, "contain", ["Testing", "PDF", "metadata"]);
    await validateDownloadedPdf(this.downloadedFilename, "not.contain", ["milk", "cheese", "eggs"]);
  }
}
