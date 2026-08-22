import { describe, it, expect } from "vitest";
import { buildDistributionShortlist } from "@/scripts/growth/distribution-shortlist";

/**
 * TRAFFIC ACQUISITION WAR MODE mission (2026-08-22) Phase 16. Real-data
 * smoke tests (this function is pure catalog/graph scoring, no analytics
 * events involved, so testing it against the actual PUBLISHED_COMPARISONS
 * data is both simpler and more meaningful than a synthetic fixture).
 */
describe("Distribution shortlist — proxy-signal comparison-page scoring", () => {
  it("returns exactly topN rows, sorted by score descending", () => {
    const rows = buildDistributionShortlist(20);
    expect(rows).toHaveLength(20);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.score).toBeLessThanOrEqual(rows[i - 1]!.score);
    }
  });

  it("every row has a real, well-formed comparison slug and positive connectivity", () => {
    const rows = buildDistributionShortlist(20);
    for (const row of rows) {
      expect(row.slug).toMatch(/^[a-z0-9-]+-vs-[a-z0-9-]+$/);
      expect(row.connectivity).toBeGreaterThan(0);
      expect(row.avgFreshness).toBeGreaterThan(0);
    }
  });

  it("a comparison with an active-partner participant is flagged commercialSurface: true", () => {
    const rows = buildDistributionShortlist(20);
    const todoistRow = rows.find((r) => r.productA === "Todoist" || r.productB === "Todoist");
    expect(todoistRow).toBeTruthy();
    expect(todoistRow?.commercialSurface).toBe(true);
  });
});
