/**
 * Sprint 8 Phase 2 — one input into the revenue score. This is an
 * editorial judgment call, not a sourced fact about any vendor: a rough,
 * documented estimate of how commercially valuable a category tends to be
 * for a comparison site (typical B2B deal size, seat-based pricing,
 * switching consideration), based on the categories already in
 * data/categories. See docs/revenue.md for the full rationale per
 * category — this table is deliberately small and easy to re-justify by
 * hand rather than derived from any formula.
 */

const CATEGORY_VALUE_SCORES: Record<string, number> = {
  crm: 9,
  automation: 8,
  "project-management": 8,
  productivity: 6,
  communication: 6,
  design: 6,
  "knowledge-base": 5,
  scheduling: 5,
};

const DEFAULT_CATEGORY_VALUE_SCORE = 5;

/** 0-10. Falls back to a neutral middle score for any category not in the table above (e.g. a new category added later). */
export function getCategoryValueScore(categorySlug: string): number {
  return CATEGORY_VALUE_SCORES[categorySlug] ?? DEFAULT_CATEGORY_VALUE_SCORE;
}

export function getCategoryValueTable(): ReadonlyArray<{ slug: string; score: number }> {
  return Object.entries(CATEGORY_VALUE_SCORES).map(([slug, score]) => ({ slug, score }));
}
