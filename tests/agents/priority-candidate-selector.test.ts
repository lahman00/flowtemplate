import { describe, it, expect } from "vitest";
import { selectPriorityCandidates } from "@/scripts/agents/seo/priority-candidate-selector";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

function inspection(overrides: Partial<UrlInspectionResult> = {}): UrlInspectionResult {
  return {
    url: "x",
    verdict: "NEUTRAL",
    coverageState: "Crawled - currently not indexed",
    indexingState: null,
    lastCrawlTime: null,
    robotsTxtState: "ALLOWED",
    pageFetchState: "SUCCESSFUL",
    googleCanonical: null,
    userCanonical: null,
    crawledAs: null,
    ...overrides,
  };
}

describe("selectPriorityCandidates", () => {
  it("never selects a URL with zero evidenced reasons, even if it would pad out toward a quota", () => {
    const candidates = selectPriorityCandidates([
      { url: "a", inspection: inspection(), inboundLinks: 10, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: null },
    ]);
    expect(candidates).toHaveLength(0);
  });

  it("selects a URL with real evidenced weaknesses", () => {
    const candidates = selectPriorityCandidates([
      { url: "a", inspection: inspection(), inboundLinks: 1, maxSimilarityToOther: 0.8, freshnessScore: 40, revenueTier: "A" },
    ]);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].reasons.length).toBeGreaterThan(0);
  });

  it("ranks a candidate with more evidenced weaknesses above one with fewer", () => {
    const candidates = selectPriorityCandidates([
      { url: "weak", inspection: inspection(), inboundLinks: 1, maxSimilarityToOther: 0.8, freshnessScore: 40, revenueTier: null },
      { url: "less-weak", inspection: inspection(), inboundLinks: 1, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: null },
    ]);
    expect(candidates[0].url).toBe("weak");
  });

  it("uses revenue tier only as a tiebreaker, never as the sole reason for selection", () => {
    const candidates = selectPriorityCandidates([
      { url: "tier-a-no-evidence", inspection: inspection(), inboundLinks: 10, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: "A" },
    ]);
    expect(candidates).toHaveLength(0); // Tier A alone, with no other evidenced weakness, is not enough
  });

  it("breaks a tie between two equally-evidenced candidates using revenue tier", () => {
    const candidates = selectPriorityCandidates([
      { url: "tier-c", inspection: inspection(), inboundLinks: 1, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: "C" },
      { url: "tier-a", inspection: inspection(), inboundLinks: 1, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: "A" },
    ]);
    expect(candidates[0].url).toBe("tier-a");
  });

  it("caps selection at 20 candidates even with more evidenced candidates available", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      url: `url-${i}`,
      inspection: inspection(),
      inboundLinks: 1,
      maxSimilarityToOther: 0.8,
      freshnessScore: 40,
      revenueTier: null as "A" | "B" | "C" | null,
    }));
    const candidates = selectPriorityCandidates(many);
    expect(candidates.length).toBeLessThanOrEqual(20);
  });

  it("detects a stale crawl as an evidenced reason using real date math", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const staleCrawl = new Date("2026-06-01T00:00:00Z").toISOString();
    const candidates = selectPriorityCandidates(
      [{ url: "a", inspection: inspection({ lastCrawlTime: staleCrawl }), inboundLinks: 10, maxSimilarityToOther: 0.1, freshnessScore: 90, revenueTier: null }],
      now
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].reasons.some((r) => r.includes("Stale crawl"))).toBe(true);
  });
});
