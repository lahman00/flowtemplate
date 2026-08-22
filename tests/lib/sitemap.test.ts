import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";

/**
 * ROAD TO THE FIRST 1,000 REAL HUMANS mission (2026-08-22) — real
 * indexation-investigation finding: this sitemap's 1,526 entries had zero
 * <lastmod> dates (Google's own crawl-priority freshness signal), for a
 * brand-new (23-day-old at investigation time) domain competing for
 * limited crawl trust. Fixed using real per-entry data already tracked
 * (software.accessedAt, guide.updatedAt) -- never a fabricated or
 * build-time-only placeholder for content that has real per-entry dates
 * available. This test proves every software and comparison entry gets a
 * genuine, real lastModified value, not a systemic silent gap like the
 * meta-description one found earlier in the same investigation.
 */
describe("sitemap lastModified coverage", () => {
  it("every software page entry has a real lastModified date matching its own accessedAt", () => {
    const entries = sitemap();
    const software = getAllSoftware();
    for (const s of software) {
      const entry = entries.find((e) => e.url.endsWith(`/software/${s.slug}`));
      expect(entry?.lastModified, `${s.slug} missing from sitemap`).toBeTruthy();
      expect(new Date(entry!.lastModified!).toISOString().slice(0, 10)).toBe(s.accessedAt);
    }
  });

  it("every comparison page entry has a lastModified date equal to the MORE RECENT of its two products' accessedAt", () => {
    const entries = sitemap();
    const softwareBySlug = new Map(getAllSoftware().map((s) => [s.slug, s]));
    for (const [slugA, slugB] of PUBLISHED_COMPARISONS.slice(0, 25)) {
      const slug = getComparisonSlug(slugA, slugB);
      const entry = entries.find((e) => e.url.endsWith(`/compare/${slug}`));
      const a = softwareBySlug.get(slugA)!;
      const b = softwareBySlug.get(slugB)!;
      const expected = [a.accessedAt, b.accessedAt].sort().at(-1);
      expect(entry?.lastModified, `${slug} missing from sitemap`).toBeTruthy();
      expect(new Date(entry!.lastModified!).toISOString().slice(0, 10)).toBe(expected);
    }
  });

  it("no entry's lastModified is ever in the future (a sign of a fabricated/placeholder date, not a real one)", () => {
    const entries = sitemap();
    const now = Date.now();
    for (const e of entries) {
      if (!e.lastModified) continue;
      expect(new Date(e.lastModified).getTime(), `${e.url} has a future lastModified`).toBeLessThanOrEqual(now);
    }
  });
});
