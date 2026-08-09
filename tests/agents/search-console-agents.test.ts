import { describe, it, expect } from "vitest";
import { analyzeCtrOpportunities } from "@/scripts/agents/growth/search-console-ctr-opportunity";
import { analyzeRankingMovement } from "@/scripts/agents/seo/search-console-ranking-movement";
import { analyzeWinnersLosers } from "@/scripts/agents/growth/search-console-winner-loser";
import { analyzeContentOpportunities } from "@/scripts/agents/growth/search-console-content-opportunity";
import type { SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Every function tested here is pure — no network call — so these tests
 * verify the actual scoring/threshold logic with synthetic-but-realistic
 * rows shaped exactly like what the real API returns (see
 * tests/agents/google-search-console.test.ts for the API-shape/auth
 * tests). Once real credentials exist, only the data source changes;
 * this logic doesn't need to be retested.
 */

function row(keys: string[], overrides: Partial<SearchAnalyticsRow> = {}): SearchAnalyticsRow {
  return { keys, clicks: 0, impressions: 0, ctr: 0, position: 1, ...overrides };
}

describe("analyzeCtrOpportunities", () => {
  it("flags a high-impression, well-positioned, low-CTR page", () => {
    const rows = [row(["/software/notion"], { impressions: 500, clicks: 5, ctr: 0.01, position: 8 })];
    const findings = analyzeCtrOpportunities("test-agent", rows);
    expect(findings).toHaveLength(1);
    expect(findings[0].location).toBe("/software/notion");
  });

  it("does not flag a low-impression page even with low CTR (not enough signal)", () => {
    const rows = [row(["/software/x"], { impressions: 10, clicks: 0, ctr: 0, position: 5 })];
    expect(analyzeCtrOpportunities("a", rows)).toHaveLength(0);
  });

  it("does not flag a page ranking too poorly to expect clicks regardless of CTR", () => {
    const rows = [row(["/software/x"], { impressions: 500, clicks: 1, ctr: 0.002, position: 45 })];
    expect(analyzeCtrOpportunities("a", rows)).toHaveLength(0);
  });

  it("does not flag a page with healthy CTR", () => {
    const rows = [row(["/software/x"], { impressions: 500, clicks: 50, ctr: 0.1, position: 5 })];
    expect(analyzeCtrOpportunities("a", rows)).toHaveLength(0);
  });
});

describe("analyzeRankingMovement", () => {
  it("flags a significant ranking drop as a regression", () => {
    const prior = [row(["notion review"], { impressions: 200, position: 5 })];
    const recent = [row(["notion review"], { impressions: 200, position: 15 })];
    const findings = analyzeRankingMovement("a", recent, prior);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("regression");
    expect(findings[0].severity).toBe("warning");
  });

  it("flags a significant ranking improvement as an opportunity", () => {
    const prior = [row(["notion review"], { impressions: 200, position: 15 })];
    const recent = [row(["notion review"], { impressions: 200, position: 4 })];
    const findings = analyzeRankingMovement("a", recent, prior);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("opportunity");
  });

  it("ignores a small, insignificant position change", () => {
    const prior = [row(["notion review"], { impressions: 200, position: 8 })];
    const recent = [row(["notion review"], { impressions: 200, position: 9 })];
    expect(analyzeRankingMovement("a", recent, prior)).toHaveLength(0);
  });

  it("ignores a query with too little impression volume to be meaningful", () => {
    const prior = [row(["obscure query"], { impressions: 3, position: 5 })];
    const recent = [row(["obscure query"], { impressions: 3, position: 40 })];
    expect(analyzeRankingMovement("a", recent, prior)).toHaveLength(0);
  });

  it("ignores a query that didn't appear in the prior window (no baseline to compare)", () => {
    const recent = [row(["brand new query"], { impressions: 200, position: 5 })];
    expect(analyzeRankingMovement("a", recent, [])).toHaveLength(0);
  });
});

describe("analyzeWinnersLosers", () => {
  it("flags a real click gain as a winner", () => {
    const prior = [row(["/software/notion"], { clicks: 10 })];
    const recent = [row(["/software/notion"], { clicks: 30 })];
    const findings = analyzeWinnersLosers("a", recent, prior);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("opportunity");
  });

  it("flags a real click drop as a loser", () => {
    const prior = [row(["/software/notion"], { clicks: 30 })];
    const recent = [row(["/software/notion"], { clicks: 10 })];
    const findings = analyzeWinnersLosers("a", recent, prior);
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("regression");
  });

  it("ignores near-zero-traffic noise", () => {
    const prior = [row(["/software/x"], { clicks: 1 })];
    const recent = [row(["/software/x"], { clicks: 3 })];
    expect(analyzeWinnersLosers("a", recent, prior)).toHaveLength(0);
  });

  it("ignores an insignificant relative change", () => {
    const prior = [row(["/software/x"], { clicks: 100 })];
    const recent = [row(["/software/x"], { clicks: 105 })];
    expect(analyzeWinnersLosers("a", recent, prior)).toHaveLength(0);
  });
});

describe("analyzeContentOpportunities", () => {
  it("flags a high-impression query with a weak position as a content gap", () => {
    const rows = [row(["best notion alternative for students"], { impressions: 200, position: 45 })];
    const findings = analyzeContentOpportunities("a", rows);
    expect(findings).toHaveLength(1);
  });

  it("does not flag a query with too few impressions", () => {
    const rows = [row(["obscure"], { impressions: 5, position: 60 })];
    expect(analyzeContentOpportunities("a", rows)).toHaveLength(0);
  });

  it("does not flag a query that already ranks reasonably", () => {
    const rows = [row(["notion review"], { impressions: 200, position: 12 })];
    expect(analyzeContentOpportunities("a", rows)).toHaveLength(0);
  });

  it("sorts results by impression volume, highest first", () => {
    const rows = [row(["low"], { impressions: 60, position: 40 }), row(["high"], { impressions: 900, position: 40 })];
    const findings = analyzeContentOpportunities("a", rows);
    expect(findings[0].title).toContain("high");
  });
});
