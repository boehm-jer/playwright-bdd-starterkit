import { test as base } from "playwright-bdd";
import { SampleDsl } from "./dsl/sampleDsl";
import { AccessibilityDsl } from "./dsl/accessibilityDsl";
import { PdfDownloadDsl } from "./dsl/pdfDownloadDsl";
import { SubmitDsl } from "./dsl/submitDsl";
import { VisualRegressionDsl } from "./dsl/visualRegressionDsl";

export const test = base.extend<{
  sampleDsl: SampleDsl;
  accessibilityDsl: AccessibilityDsl;
  pdfDownloadDsl: PdfDownloadDsl;
  submitDsl: SubmitDsl;
  visualRegressionDsl: VisualRegressionDsl;
}>({
  sampleDsl: async ({ page }, use) => {
    await use(new SampleDsl(page));
  },
  accessibilityDsl: async ({ page }, use) => {
    await use(new AccessibilityDsl(page));
  },
  pdfDownloadDsl: async ({ page }, use) => {
    await use(new PdfDownloadDsl(page));
  },
  submitDsl: async ({ page }, use) => {
    await use(new SubmitDsl(page));
  },
  visualRegressionDsl: async ({ page }, use) => {
    await use(new VisualRegressionDsl(page));
  },
});
