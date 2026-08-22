import { describe, it, expect } from "vitest";
import { buildIndexationPriorityList } from "@/scripts/growth/indexation-priority";

/**
 * ROAD TO THE FIRST 1,000 REAL HUMANS mission (2026-08-22) Priority 2.
 * Real-data smoke tests: every row must correctly disclose whether it's
 * backed by real cached GSC evidence or only an inferred structural
 * proxy -- the whole point of this tool is never letting a proxy signal
 * masquerade as real demand data.
 */
describe("buildIndexationPriorityList", () => {
  it("returns exactly topN rows sorted by score descending", () => {
    const rows = buildIndexationPriorityList(50);
    expect(rows).toHaveLength(50);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.score).toBeLessThanOrEqual(rows[i - 1]!.score);
    }
  });

  it("every CACHED row carries real gscImpressions/gscPosition; every INFERRED row carries neither", () => {
    const rows = buildIndexationPriorityList(50);
    for (const row of rows) {
      if (row.evidenceType === "CACHED") {
        expect(row.gscImpressions).toBeGreaterThanOrEqual(0);
        expect(row.gscPosition).toBeGreaterThan(0);
      } else {
        expect(row.gscImpressions).toBeUndefined();
        expect(row.gscPosition).toBeUndefined();
      }
    }
  });

  it("real cached evidence always outranks a purely inferred page", () => {
    const rows = buildIndexationPriorityList(50);
    const lastCached = [...rows].reverse().find((r) => r.evidenceType === "CACHED");
    const firstInferred = rows.find((r) => r.evidenceType === "INFERRED");
    if (lastCached && firstInferred) {
      const lastCachedIndex = rows.indexOf(lastCached);
      const firstInferredIndex = rows.indexOf(firstInferred);
      expect(lastCachedIndex).toBeLessThan(firstInferredIndex);
    }
  });

  it("postmark (a real, confirmed striking-distance opportunity) appears with its real cached position", () => {
    const rows = buildIndexationPriorityList(50);
    const postmark = rows.find((r) => r.url === "/software/postmark");
    expect(postmark?.evidenceType).toBe("CACHED");
    expect(postmark?.gscPosition).toBe(10);
  });
});
