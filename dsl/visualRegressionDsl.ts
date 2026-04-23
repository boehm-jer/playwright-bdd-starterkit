import { BrowserDsl } from './base/BrowserDsl';

export abstract class VisualRegressionDsl extends BrowserDsl {
  abstract navigateToExampleCom(): Promise<void>;
  abstract setScreenshotName(name: string): Promise<void>;
  abstract compareWithBaseline(): Promise<void>;
}
