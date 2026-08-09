import { describe, it, expect } from "vitest";
import { analyzeCanonicalConsistency } from "@/scripts/agents/seo/canonical-consistency-analyzer";
import { analyzeCrawlRecency } from "@/scripts/agents/seo/crawl-recency-analyzer";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

function inspection(overrides: Partial<UrlInspectionResult>): UrlInspectionResult {
  return {
    url: "https://miloosh.com/software/notion",
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

describe("analyzeCanonicalConsistency", () => {
  it("flags nothing when both canonicals are missing (no data, not a finding)", () => {
    const map = new Map([["https://miloosh.com/software/notion", inspection({})]]);
    expect(analyzeCanonicalConsistency("a", map)).toHaveLength(0);
  });

  it("flags nothing when the declared canonical matches the page's own URL and Google agrees", () => {
    const url = "https://miloosh.com/software/notion";
    const map = new Map([[url, inspection({ userCanonical: url, googleCanonical: url })]]);
    expect(analyzeCanonicalConsistency("a", map)).toHaveLength(0);
  });

  it("flags a declared canonical that doesn't match the page's own URL", () => {
    const url = "https://miloosh.com/software/notion";
    const map = new Map([[url, inspection({ userCanonical: "https://miloosh.com/software/notion-old" })]]);
    const findings = analyzeCanonicalConsistency("a", map);
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain("doesn't match the page's own URL");
  });

  it("flags Google overriding a correctly self-declared canonical", () => {
    const url = "https://miloosh.com/software/notion";
    const map = new Map([[url, inspection({ userCanonical: url, googleCanonical: "https://miloosh.com/software/notion-duplicate" })]]);
    const findings = analyzeCanonicalConsistency("a", map);
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain("Google selected a different canonical");
  });
});

describe("analyzeCrawlRecency", () => {
  const url = "https://miloosh.com/compare/a-vs-b";

  it("flags nothing for an indexed page (only crawled-not-indexed pages are in scope)", () => {
    const map = new Map([[url, inspection({ coverageState: "Submitted and indexed" })]]);
    expect(analyzeCrawlRecency("a", map)).toHaveLength(0);
  });

  it("flags a robots.txt block as critical, before checking crawl age", () => {
    const map = new Map([[url, inspection({ robotsTxtState: "DISALLOWED" })]]);
    const findings = analyzeCrawlRecency("a", map);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("critical");
    expect(findings[0].title).toContain("robots.txt blocks");
  });

  it("flags a failed page fetch as critical", () => {
    const map = new Map([[url, inspection({ pageFetchState: "SOFT_404" })]]);
    const findings = analyzeCrawlRecency("a", map);
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain("could not successfully fetch");
  });

  it("flags a missing crawl timestamp", () => {
    const map = new Map([[url, inspection({ lastCrawlTime: null })]]);
    const findings = analyzeCrawlRecency("a", map);
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain("No recorded crawl time");
  });

  it("flags a stale crawl (>30 days) with a real age computation", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const oldCrawl = new Date("2026-06-01T00:00:00Z").toISOString();
    const map = new Map([[url, inspection({ lastCrawlTime: oldCrawl })]]);
    const findings = analyzeCrawlRecency("a", map, now);
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain("Stale crawl");
  });

  it("does not flag a recent crawl (<30 days)", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const recentCrawl = new Date("2026-08-01T00:00:00Z").toISOString();
    const map = new Map([[url, inspection({ lastCrawlTime: recentCrawl })]]);
    expect(analyzeCrawlRecency("a", map, now)).toHaveLength(0);
  });
});
