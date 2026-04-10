/*
Pattern: const array → type → assertion function
The "as const" array is the single source of truth — it drives both the TypeScript
type (via indexed access) and the runtime validation, so they never drift apart.
To add a new type, follow the same three steps below:
  1. export const MY_VALUES = ["a", "b"] as const;
  2. export type MyType = typeof MY_VALUES[number];
  3. export function assertValidMyType(value: string): asserts value is MyType { ... }
*/


export const AXE_CORE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;
export type axeCoreTag = typeof AXE_CORE_TAGS[number];
export function assertValidAxeCoreTag(value: string): asserts value is axeCoreTag {
  if (!AXE_CORE_TAGS.includes(value as axeCoreTag)) {
    throw new Error(
      `Invalid axe-core tag: "${value}". Must be one of: ${AXE_CORE_TAGS.join(", ")}`
    );
  }
}
