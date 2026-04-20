import { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  assertValidImpactValue,
  violationsAtOrAbove,
  ImpactValue,
} from "../helpers/accessibilityImpactHelpers";

export class AccessibilityDsl {
  constructor(private page: Page) {}

  async navigateTo(website: string) {
    await this.page.goto(`https://${website}`);
  }

  async getViolationsAtOrAbove(impact: string) {
    assertValidImpactValue(impact);
    const { violations } = await new AxeBuilder({ page: this.page }).analyze();
    return violations.filter(violationsAtOrAbove(impact as ImpactValue));
  }
}
