import { BaseDsl } from './BaseDsl';
import { Selector } from '../../support/selector';

export abstract class BrowserDsl extends BaseDsl {
  abstract click(selector: Selector): Promise<void>;
  abstract fill(selector: Selector, value: string): Promise<void>;
  abstract isVisible(selector: Selector): Promise<boolean>;
  abstract isInViewport(selector: Selector): Promise<boolean>;
  abstract getText(selector: Selector): Promise<string>;
  abstract pressKey(key: string): Promise<void>;
  abstract scrollIntoView(selector: Selector): Promise<void>;
  abstract waitForLoad(): Promise<void>;
  abstract clickAndNavigate(selector: Selector): Promise<void>;
}
