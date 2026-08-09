import { describe, it, expect } from "vitest";
import { snapshotsBefore, readSnapshots } from "@/lib/agents/gsc-snapshot";
import type { GscSnapshot } from "@/lib/agents/gsc-snapshot";

function snapshot(overrides: Partial<GscSnapshot>): GscSnapshot {
  return {
    capturedAt: "2026-08-01",
    source: "owner-reported",
    scope: "test",
    sitemapUrls: 100,
    indexed: 10,
    notIndexed: 90,
    exclusions: [],
    impressions: null,
    clicks: null,
    averageCtr: null,
    averagePosition: null,
    byTemplate: null,
    notes: null,
    ...overrides,
  };
}

describe("snapshotsBefore", () => {
  it("returns only snapshots strictly before the given date, most recent first", () => {
    const snapshots = [snapshot({ capturedAt: "2026-08-01" }), snapshot({ capturedAt: "2026-08-05" }), snapshot({ capturedAt: "2026-08-10" })];
    const before = snapshotsBefore(snapshots, "2026-08-10");
    expect(before.map((s) => s.capturedAt)).toEqual(["2026-08-05", "2026-08-01"]);
  });

  it("returns an empty array when nothing precedes the given date", () => {
    const snapshots = [snapshot({ capturedAt: "2026-08-05" })];
    expect(snapshotsBefore(snapshots, "2026-08-01")).toEqual([]);
  });
});

describe("readSnapshots (real file, seeded by scripts/agents/seo/seed-gsc-baseline.ts)", () => {
  it("reads real snapshot data without throwing, in the documented shape", () => {
    const snapshots = readSnapshots();
    expect(Array.isArray(snapshots)).toBe(true);
    // Seeded at least once during this session's Phase 2 GSC work — don't assert exact length (append-only, may grow), just shape.
    if (snapshots.length > 0) {
      const first = snapshots[0];
      expect(["owner-reported", "api"]).toContain(first.source);
      expect(typeof first.scope).toBe("string");
    }
  });
});
