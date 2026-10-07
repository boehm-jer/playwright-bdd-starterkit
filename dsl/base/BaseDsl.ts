export abstract class BaseDsl {
  abstract navigate(url: string): Promise<void>;
  abstract getTitle(): Promise<string>;
  abstract getUrl(): Promise<string>;

  /**
   * Attach a piece of metadata to the running test, for the report.
   *
   * With a data-driven Scenario Outline, a failure has to name the real-world row it came from,
   * not just "Example #7". The runner's metadata API (Playwright's `TestInfo`) is driver-specific,
   * so a step calling it directly would reach past the DSL layer — which the step layer's one
   * absolute rule forbids. Declaring it here keeps step bodies to pure DSL calls and confines
   * `TestInfo` to the adapter. Every runner has some notion of per-test metadata, so this is as
   * driver-neutral as `navigate`.
   */
  abstract annotate(type: string, description: string): Promise<void>;
}
