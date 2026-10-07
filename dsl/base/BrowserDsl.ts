import { BaseDsl } from './BaseDsl';
import { Selector } from '../../support/selector';

/**
 * One browser cookie, in the terms every driver already uses.
 *
 * Deliberately a plain record and not a driver's own Cookie type: Playwright, Cypress, Selenium
 * and WebdriverIO all take and return these same eight fields, so a suite that swaps drivers
 * carries its session handling across unchanged. `expires` is epoch SECONDS, with -1 meaning a
 * session cookie that dies with the browser.
 */
export type SessionCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
};

export abstract class BrowserDsl extends BaseDsl {
  abstract click(selector: Selector): Promise<void>;
  abstract fill(selector: Selector, value: string): Promise<void>;
  abstract isVisible(selector: Selector): Promise<boolean>;
  abstract isInViewport(selector: Selector): Promise<boolean>;
  abstract getText(selector: Selector): Promise<string>;

  /**
   * Text of EVERY element matching the selector, in document order.
   *
   * `getText` reads one element; a table column is inherently many. Returns [] when nothing
   * matches — an empty column is a legitimate observation, not an error, and the caller decides
   * what it means.
   */
  abstract getAllText(selector: Selector): Promise<string[]>;

  /**
   * The `value` of EVERY element matching the selector, in document order.
   *
   * A form control's current value is not its text: `getAllText` returns "" for an `<input>`
   * however full it is. Without this a suite can fill a control but never read back what it
   * holds, so it cannot tell "already correct" from "not applied".
   *
   * Returns [] when nothing matches, like `getAllText`. Playwright `inputValue`, Cypress
   * `.invoke('val')`, Selenium `getAttribute('value')`.
   */
  abstract getAllValues(selector: Selector): Promise<string[]>;

  abstract pressKey(key: string): Promise<void>;
  abstract scrollIntoView(selector: Selector): Promise<void>;
  abstract waitForLoad(): Promise<void>;
  abstract clickAndNavigate(selector: Selector): Promise<void>;

  /**
   * Uncaught runtime errors thrown by the page since it was opened.
   *
   * A page can render correctly and THEN throw, replacing itself with an error screen. An
   * assertion that samples the DOM once and stops looking passes on that transient good state.
   * Every driver can observe uncaught page errors, so this belongs in the contract.
   *
   * Check these BEFORE reading the DOM: a page that has thrown has usually torn out the element
   * you are about to wait for, so reading first turns an instant, accurate failure into a slow
   * timeout that names the wrong thing.
   */
  abstract getUncaughtErrors(): Promise<string[]>;

  /**
   * Wait until `selector` is attached to, or detached from, the DOM. Returns whether it got there.
   * Never throws.
   *
   * Every other query here is a SNAPSHOT: `getAllText` and `isVisible` answer immediately and
   * return [] / false the instant nothing matches, which is indistinguishable from "not yet". And
   * there is no sleep primitive to poll with — deliberately, because a fixed delay is either too
   * short (flaky) or too long (slow) and hides what the test is waiting for.
   *
   * `waitForLoad()` cannot stand in for it on a single-page app: a client-side re-render after a
   * click never navigates, so the page is already "loaded" and a load-state wait returns at once
   * with the new content still missing.
   *
   * Returns a boolean rather than throwing because a timeout here is an OBSERVATION — "the table
   * never arrived" — which the DSL turns into a failure message that says so. `timeoutMs` has no
   * default, so every caller states its own budget out loud; it is an upper bound, never a delay.
   *
   * Playwright `locator.waitFor({state})`, Cypress `.should('exist' | 'not.exist')`, WebdriverIO
   * `waitForExist`, Selenium `presenceOfElementLocated` / `invisibilityOf`.
   */
  abstract waitFor(
    selector: Selector,
    state: "attached" | "detached",
    timeoutMs: number
  ): Promise<boolean>;

  /**
   * Every cookie this browser currently holds.
   *
   * Exists so a suite does not have to sign in once per scenario. Identity providers rate-limit
   * repeated logins for one user, and a suite with many signed-in scenarios will trip that
   * brute-force protection — failing whichever rows happen to run last, in a way that looks like a
   * product bug. Capture a session once per worker and replay it into each later browser instead.
   *
   * Replay is only safe when the app's session is a self-contained cookie rather than a handle to
   * server-side state that a parallel logout could revoke. Verify that for your app before
   * relying on it.
   *
   * These move ALL cookies; deciding which ones are the session belongs in a helper that knows
   * the app. Playwright `context.cookies()` / `addCookies()`, Cypress `cy.getCookies()` /
   * `cy.setCookie()`, Selenium `getCookies()` / `addCookie()`, WebdriverIO `getCookies()` /
   * `setCookies()`.
   */
  abstract captureSession(): Promise<SessionCookie[]>;

  /**
   * Put cookies into this browser. Call BEFORE navigating: a cookie added after the page has
   * loaded does not retroactively authenticate the request that fetched it.
   */
  abstract restoreSession(cookies: SessionCookie[]): Promise<void>;
}
