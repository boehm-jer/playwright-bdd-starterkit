import { BrowserDsl } from './base/BrowserDsl';
import { by } from '../support/selector';

export class SubmitDsl {
  constructor(private readonly browser: BrowserDsl) {}

  async navigateToSubmissionPage(): Promise<void> {
    await this.browser.navigate("https://example.cypress.io/commands/actions");
  }

  async enterText(text: string): Promise<void> {
    await this.browser.scrollIntoView(by.label("Coupon Code"));
    await this.browser.fill(by.label("Coupon Code"), text);
    await this.browser.pressKey("Enter");
  }

  async isSubmissionConfirmed(): Promise<boolean> {
    return this.browser.isVisible(by.text("Your form has been submitted!", true));
  }
}
