import AxeBuilder from "@axe-core/playwright";
import { AccessibilityDsl, AxeViolation } from "../../dsl/accessibilityDsl";
import { PlaywrightBrowserDsl } from "./PlaywrightBrowserDsl";
import { assertValidImpactValue, violationsAtOrAbove } from "../../helpers/accessibilityImpactHelpers";

export class PlaywrightAccessibilityDsl extends PlaywrightBrowserDsl implements AccessibilityDsl {
  async navigateTo(website: string): Promise<void> {
    await this.page.goto(`https://${website}`);
  }

  async getViolationsAtOrAbove(impact: string): Promise<AxeViolation[]> {
    assertValidImpactValue(impact);
    const { violations } = await new AxeBuilder({ page: this.page }).analyze();
    return violations.filter(violationsAtOrAbove(impact));
  }
}
