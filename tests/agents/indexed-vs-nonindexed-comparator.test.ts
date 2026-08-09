import { describe, it, expect } from "vitest";
import { compareIndexationGroups } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import type { UrlProfile } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";

function profile(overrides: Partial<UrlProfile>): UrlProfile {
  return {
    url: "https://miloosh.com/software/x",
    template: "software",
    indexState: "crawled_not_indexed",
    inboundLinks: null,
    contentLength: null,
    freshnessScore: null,
    revenueTier: null,
    maxSimilarityToOther: null,
    impressions: null,
    clicks: null,
    ...overrides,
  };
}

describe("compareIndexationGroups", () => {
  it("declines to compare when one group is empty — never fabricates a comparison", () => {
    const profiles = [profile({ indexState: "indexed" })];
    const { findings, summary } = compareIndexationGroups("test-agent", profiles);
    expect(findings).toEqual([]);
    expect(summary).toContain("need at least one of each");
  });

  it("declines to compare when both groups are empty", () => {
    const { findings } = compareIndexationGroups("test-agent", []);
    expect(findings).toEqual([]);
  });

  it("flags a real, large difference in a numeric dimension as an evidence-graded finding", () => {
    const profiles = [
      profile({ url: "a", indexState: "indexed", inboundLinks: 10 }),
      profile({ url: "b", indexState: "indexed", inboundLinks: 12 }),
      profile({ url: "c", indexState: "crawled_not_indexed", inboundLinks: 1 }),
      profile({ url: "d", indexState: "crawled_not_indexed", inboundLinks: 1 }),
    ];
    const { findings } = compareIndexationGroups("test-agent", profiles);
    const linkFinding = findings.find((f) => f.title.includes("internal inbound link count"));
    expect(linkFinding).toBeDefined();
    expect(linkFinding!.description).toContain("OBSERVATION:");
    expect(linkFinding!.description).toContain("HYPOTHESIS:");
    expect(linkFinding!.description).toContain("PROPOSED TEST:");
    expect(linkFinding!.confidence).toBeLessThan(0.5); // never overconfident about a correlation
  });

  it("does not flag a dimension with only a small, insignificant difference between groups", () => {
    const profiles = [
      profile({ url: "a", indexState: "indexed", inboundLinks: 10 }),
      profile({ url: "b", indexState: "crawled_not_indexed", inboundLinks: 9 }),
    ];
    const { findings } = compareIndexationGroups("test-agent", profiles);
    expect(findings.find((f) => f.title.includes("internal inbound link count"))).toBeUndefined();
  });

  it("skips a dimension entirely when neither group has any data for it", () => {
    const profiles = [profile({ url: "a", indexState: "indexed" }), profile({ url: "b", indexState: "crawled_not_indexed" })];
    const { findings } = compareIndexationGroups("test-agent", profiles);
    expect(findings.filter((f) => f.title.includes("internal inbound link count"))).toEqual([]);
  });

  it("always reports template distribution alongside numeric dimensions", () => {
    const profiles = [
      profile({ url: "a", indexState: "indexed", template: "software" }),
      profile({ url: "b", indexState: "crawled_not_indexed", template: "comparison" }),
    ];
    const { findings } = compareIndexationGroups("test-agent", profiles);
    expect(findings.some((f) => f.title.includes("Template distribution"))).toBe(true);
  });

  it("never states a hypothesis as a fact — every finding's recommendedAction is a test, not a claim of causation", () => {
    const profiles = [
      profile({ url: "a", indexState: "indexed", contentLength: 500 }),
      profile({ url: "b", indexState: "crawled_not_indexed", contentLength: 50 }),
    ];
    const { findings } = compareIndexationGroups("test-agent", profiles);
    for (const f of findings) {
      expect(f.recommendedAction).toBeTruthy();
      expect(f.description).not.toMatch(/because of|caused by|is why/i);
    }
  });
});
