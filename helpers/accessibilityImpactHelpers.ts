/*
Pattern: const array → type → assertion function → filter helper
See e2eTypeDefinitions.ts for the full pattern explanation.
*/

export const IMPACT_LEVELS = ["minor", "moderate", "serious", "critical"] as const;
export type ImpactValue = typeof IMPACT_LEVELS[number];

export function assertValidImpactValue(value: string): asserts value is ImpactValue {
  if (!IMPACT_LEVELS.includes(value as ImpactValue)) {
    throw new Error(
      `Invalid impact level: "${value}". Must be one of: ${IMPACT_LEVELS.join(", ")}`
    );
  }
}

// Returns a filter function that matches violations at or above the given impact level.
// e.g. violationsAtOrAbove("serious") catches both "serious" and "critical".
export function violationsAtOrAbove(impact: ImpactValue) {
  const threshold = IMPACT_LEVELS.indexOf(impact);
  return (violation: { impact?: string | null }) =>
    IMPACT_LEVELS.indexOf(violation.impact as ImpactValue) >= threshold;
}
