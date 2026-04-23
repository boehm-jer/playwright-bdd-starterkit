import { BrowserDsl } from './base/BrowserDsl';

export type AxeViolation = { impact?: string | null; [key: string]: unknown };

export abstract class AccessibilityDsl extends BrowserDsl {
  abstract navigateTo(website: string): Promise<void>;
  abstract getViolationsAtOrAbove(impact: string): Promise<AxeViolation[]>;
}
