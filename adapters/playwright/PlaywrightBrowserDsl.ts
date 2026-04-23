import { Page, Locator } from "@playwright/test";
import { BrowserDsl } from "../../dsl/base/BrowserDsl";
import { Selector } from "../../support/selector";

export class PlaywrightBrowserDsl extends BrowserDsl {
  constructor(protected readonly page: Page) {
    super();
  }

  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async click(selector: Selector): Promise<void> {
    await this.resolve(selector).click();
  }

  async fill(selector: Selector, value: string): Promise<void> {
    await this.resolve(selector).fill(value);
  }

  async isVisible(selector: Selector): Promise<boolean> {
    return this.resolve(selector).isVisible();
  }

  async isInViewport(selector: Selector): Promise<boolean> {
    return this.resolve(selector).isInViewport();
  }

  async getText(selector: Selector): Promise<string> {
    return this.resolve(selector).innerText();
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async scrollIntoView(selector: Selector): Promise<void> {
    await this.resolve(selector).scrollIntoViewIfNeeded();
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("load");
  }

  async clickAndNavigate(selector: Selector): Promise<void> {
    const initialUrl = this.page.url();
    await this.resolve(selector).click();
    await this.page.waitForURL((url) => url.toString() !== initialUrl);
    await this.page.waitForLoadState("networkidle");
  }

  protected resolve(selector: Selector): Locator {
    switch (selector.kind) {
      case "role":     return this.page.getByRole(selector.role as Parameters<Page["getByRole"]>[0], selector.options);
      case "testId":   return this.page.getByTestId(selector.id);
      case "css":      return this.page.locator(selector.css);
      case "text":     return this.page.getByText(selector.text, { exact: selector.exact });
      case "label":    return this.page.getByLabel(selector.label);
      case "title":    return this.page.getByTitle(selector.title);
      case "ariaLabel": return this.page.locator(`[aria-label="${selector.label}"]`);
    }
  }
}
