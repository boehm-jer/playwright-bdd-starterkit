import { SampleDsl } from '../dsl/sampleDsl';
import { AccessibilityDsl } from '../dsl/accessibilityDsl';
import { PdfDownloadDsl } from '../dsl/pdfDownloadDsl';
import { SubmitDsl } from '../dsl/submitDsl';
import { VisualRegressionDsl } from '../dsl/visualRegressionDsl';

export class ScenarioContext {
  constructor(
    public readonly sample: SampleDsl,
    public readonly accessibility: AccessibilityDsl,
    public readonly pdfDownload: PdfDownloadDsl,
    public readonly submit: SubmitDsl,
    public readonly visualRegression: VisualRegressionDsl,
  ) {}
}
