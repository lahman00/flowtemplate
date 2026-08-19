import { describe, expect, it } from "vitest";
import { assessPublicationThreshold, experimentIsCoolingDown } from "@/lib/seo-factory/policy";
import { computeOpportunityScore, selectCanonicalWinner } from "@/lib/seo-factory/run";
import type { ScoreComponent } from "@/lib/seo-factory/types";

describe("SEO Factory scoring and safety policy", () => {
  it("excludes unavailable signals instead of treating them as zero", () => {
    const components: ScoreComponent[] = [
      { name: "real", value: 1, weight: 3, kind: "real", source: "GSC", confidence: "high" },
      { name: "missing", value: null, weight: 100, kind: "unavailable", source: "none", confidence: "low" },
    ];
    expect(computeOpportunityScore(components)).toBe(100);
  });

  it("gives a higher score to otherwise equal active-affiliate evidence", () => {
    const base: ScoreComponent[] = [{ name: "demand", value: 0.7, weight: 3, kind: "real", source: "GSC", confidence: "high" }];
    const inactive = [...base, { name: "affiliate", value: 0, weight: 1, kind: "derived", source: "registry", confidence: "high" } as ScoreComponent];
    const active = [...base, { name: "affiliate", value: 1, weight: 1, kind: "derived", source: "registry", confidence: "high" } as ScoreComponent];
    expect(computeOpportunityScore(active)).toBeGreaterThan(computeOpportunityScore(inactive));
  });

  it("selects the canonical query winner by clicks, then impressions, then position", () => {
    expect(selectCanonicalWinner([
      { keys: ["q", "https://miloosh.com/software/a"], clicks: 1, impressions: 100, ctr: 0.01, position: 5 },
      { keys: ["q", "https://miloosh.com/software/b"], clicks: 2, impressions: 20, ctr: 0.1, position: 2 },
    ])).toBe("/software/b");
  });

  it("never marks a page publishable in Level 0, even with strong evidence", () => {
    const result = assessPublicationThreshold({ impressions: 1000, intent: "PRICING", existingCanonical: null, factualSources: 5, internalLinkSources: 8, uniqueDecisionValue: true, cannibalizationRisk: "none" });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain("SEO Factory v1 autonomy is Level 0 (analysis only)");
  });

  it("fails weak page ideas with explicit evidence blockers", () => {
    const result = assessPublicationThreshold({ impressions: 2, intent: "UNKNOWN", existingCanonical: "/software/pipedrive", factualSources: 0, internalLinkSources: 0, uniqueDecisionValue: false, cannibalizationRisk: "confirmed" });
    expect(result.blockers).toHaveLength(8);
  });

  it("enforces an experiment measurement cooldown and treats malformed dates as unsafe", () => {
    const now = Date.parse("2026-08-20T00:00:00Z");
    expect(experimentIsCoolingDown("2026-08-01T00:00:00Z", 28, now)).toBe(true);
    expect(experimentIsCoolingDown("2026-07-01T00:00:00Z", 28, now)).toBe(false);
    expect(experimentIsCoolingDown("not-a-date", 28, now)).toBe(true);
  });
});
