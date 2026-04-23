import { BrowserDsl } from './base/BrowserDsl';

export abstract class PdfDownloadDsl extends BrowserDsl {
  abstract visitWikimediaPage(): Promise<void>;
  abstract verifyPageLoaded(): Promise<void>;
  abstract downloadPdf(): Promise<void>;
  abstract validatePdfContent(): Promise<void>;
}
