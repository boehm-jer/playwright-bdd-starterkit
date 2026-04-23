import { BrowserDsl } from './base/BrowserDsl';
import { by } from '../support/selector';

export class SampleDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async goToHomePage(): Promise<void> {
    await this.browser.navigate("https://playwright.dev");
  }

  async clickLink(name: string): Promise<void> {
    await this.browser.clickAndNavigate(by.role("link", { name }));
  }

  async getTitle(): Promise<string> {
    return this.browser.getTitle();
  }
}
