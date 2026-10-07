import { Page, Locator, TestInfo } from "@playwright/test";
import { BrowserDsl, SessionCookie } from "../../dsl/base/BrowserDsl";
import { Selector } from "../../support/selector";

export class PlaywrightBrowserDsl extends BrowserDsl {
  private readonly uncaughtErrors: string[] = [];

  constructor(
    protected readonly page: Page,
    protected readonly testInfo: TestInfo
  ) {
    super();
    // Subscribe before any navigation so nothing is missed.
    this.page.on("pageerror", (error) => {
      this.uncaughtErrors.push(error.message);
    });
  }

  async navigate(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /** `TestInfo` is Playwright's, so this is the only layer allowed to touch it. */
  async annotate(type: string, description: string): Promise<void> {
    this.testInfo.annotations.push({ type, description });
  }

  async getUncaughtErrors(): Promise<string[]> {
    return [...this.uncaughtErrors];
  }

  /**
   * `.first()` is deliberate: callers legitimately pass selectors that match many elements
   * (`thead th`, `[role=option]`), and "has this arrived yet" is answered by the first match.
   * Without it a multi-match selector is a strict-mode violation and the wait throws instead of
   * reporting.
   */
  async waitFor(
    selector: Selector,
    state: "attached" | "detached",
    timeoutMs: number
  ): Promise<boolean> {
    try {
      await this.resolve(selector).first().waitFor({ state, timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
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

  /**
   * Playwright's `Locator` has no `isInViewport()` query — `toBeInViewport` is an expect matcher,
   * and a driver-agnostic DSL cannot call `expect`. This is the query-shaped equivalent.
   */
  async isInViewport(selector: Selector): Promise<boolean> {
    return this.resolve(selector).evaluate((el: Element) => {
      const r = el.getBoundingClientRect();
      return (
        r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0
      );
    });
  }

  async getText(selector: Selector): Promise<string> {
    return this.resolve(selector).innerText();
  }

  async getAllText(selector: Selector): Promise<string[]> {
    return this.resolve(selector).allInnerTexts();
  }

  async getAllValues(selector: Selector): Promise<string[]> {
    // evaluateAll rather than inputValue(): it is the many-element form, and it returns [] for
    // zero matches instead of throwing, which keeps "control absent" an observation.
    return this.resolve(selector).evaluateAll((els) =>
      els.map((el) => (el as HTMLInputElement).value ?? "")
    );
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Brings the element to the TOP of the viewport, every time.
   *
   * `scrollIntoViewIfNeeded()` has no predictable resting place — it leaves an on-screen element
   * alone, and may bottom-align or centre an off-screen one — so a caller cannot know what the
   * viewer (or a trace) will be looking at. Top alignment is deterministic. `behavior: "instant"`
   * because a smooth scroll is still moving when this returns.
   */
  async scrollIntoView(selector: Selector): Promise<void> {
    await this.resolve(selector).evaluate((el) =>
      el.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" })
    );
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

  /**
   * Cookies live on the CONTEXT, not the page. Playwright gives each test a fresh context, which
   * is why an anonymous scenario needs no logout: nothing put a cookie in it.
   *
   * `sameSite` is narrowed rather than cast: Playwright types it as optional, and "Lax" is what
   * browsers default an unspecified SameSite to, so stating it keeps the round trip honest.
   */
  async captureSession(): Promise<SessionCookie[]> {
    const cookies = await this.page.context().cookies();
    return cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite ?? "Lax",
    }));
  }

  async restoreSession(cookies: SessionCookie[]): Promise<void> {
    await this.page.context().addCookies(cookies);
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
