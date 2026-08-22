import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildIndexationPriorityList, loadCachedGscOpportunities, GSC_CACHE_PATH } from "@/scripts/growth/indexation-priority";

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

/**
 * EMERGENCY BUILD FIX (2026-08-22) regression suite. The real production
 * incident: this file used to `import gscOpportunityMining from
 * "@/var/agents/gsc-opportunity-mining.json"` at compile time -- but
 * /var/ is gitignored (agent working state, never committed by design),
 * so the file only ever existed in this local session's filesystem. A
 * clean Vercel checkout has no such file, and the static import broke
 * the production build outright ("Cannot find module"). Fixed by loading
 * the cache at RUNTIME via fs.readFileSync instead, so its presence or
 * absence is a data question at run time, never a compile-time
 * dependency. These tests manipulate the REAL cache file on disk
 * (backup/restore, matching this codebase's established convention for
 * exercising real fs-backed state) to prove every failure mode degrades
 * safely rather than crashing or fabricating data.
 */
describe("GSC cache loading — missing/invalid file must never crash or fabricate data", () => {
  let backup: string | null = null;

  beforeEach(() => {
    backup = fs.existsSync(GSC_CACHE_PATH) ? fs.readFileSync(GSC_CACHE_PATH, "utf-8") : null;
  });

  afterEach(() => {
    if (backup !== null) {
      fs.writeFileSync(GSC_CACHE_PATH, backup);
    } else {
      fs.rmSync(GSC_CACHE_PATH, { force: true });
    }
  });

  it("a missing cache file does not crash and yields zero cached evidence", () => {
    fs.rmSync(GSC_CACHE_PATH, { force: true });
    expect(() => loadCachedGscOpportunities()).not.toThrow();
    expect(loadCachedGscOpportunities().size).toBe(0);

    const rows = buildIndexationPriorityList(50);
    expect(rows).toHaveLength(50);
    expect(rows.every((r) => r.evidenceType === "INFERRED")).toBe(true);
    expect(rows.every((r) => r.gscImpressions === undefined && r.gscPosition === undefined)).toBe(true);
  });

  it("a present, well-formed cache file is parsed correctly", () => {
    fs.mkdirSync(path.dirname(GSC_CACHE_PATH), { recursive: true });
    fs.writeFileSync(GSC_CACHE_PATH, JSON.stringify({ allOpportunities: [{ targetSlug: "postmark", baselineImpressions: 6, baselinePosition: 10 }] }));
    const map = loadCachedGscOpportunities();
    expect(map.get("postmark")).toEqual({ targetSlug: "postmark", baselineImpressions: 6, baselinePosition: 10 });
  });

  it("invalid JSON in the cache file fails safely — no crash, no fabricated rows", () => {
    fs.mkdirSync(path.dirname(GSC_CACHE_PATH), { recursive: true });
    fs.writeFileSync(GSC_CACHE_PATH, "{not valid json");
    expect(() => loadCachedGscOpportunities()).not.toThrow();
    expect(loadCachedGscOpportunities().size).toBe(0);
  });

  it("a wrong-shape cache file (valid JSON, unexpected structure) fails safely", () => {
    fs.mkdirSync(path.dirname(GSC_CACHE_PATH), { recursive: true });
    fs.writeFileSync(GSC_CACHE_PATH, JSON.stringify({ somethingElse: true }));
    expect(loadCachedGscOpportunities().size).toBe(0);
  });

  it("malformed entries within an otherwise-valid array are silently dropped, not fabricated into shape", () => {
    fs.mkdirSync(path.dirname(GSC_CACHE_PATH), { recursive: true });
    fs.writeFileSync(GSC_CACHE_PATH, JSON.stringify({ allOpportunities: [{ targetSlug: "postmark", baselineImpressions: 6, baselinePosition: 10 }, { targetSlug: "broken-entry" }, "not-even-an-object"] }));
    const map = loadCachedGscOpportunities();
    expect(map.size).toBe(1);
    expect(map.has("postmark")).toBe(true);
    expect(map.has("broken-entry")).toBe(false);
  });
});
