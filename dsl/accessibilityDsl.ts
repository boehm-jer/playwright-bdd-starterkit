import { BrowserDsl } from './base/BrowserDsl';

/**
 * The fields of an axe-core result this suite reads or reports. Named fields rather than an index
 * signature, which axe-core's own `Result` type does not satisfy.
 */
export type AxeViolation = { id: string; impact?: string | null; help: string };

export abstract class AccessibilityDsl extends BrowserDsl {
  abstract navigateTo(website: string): Promise<void>;
  abstract getViolationsAtOrAbove(impact: string): Promise<AxeViolation[]>;
}
