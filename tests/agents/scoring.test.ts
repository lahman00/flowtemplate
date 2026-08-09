import { describe, it, expect } from "vitest";
import { computeImpactScore, impactBucket } from "@/lib/agents/scoring";
import { getAllSoftware } from "@/data/software";

describe("computeImpactScore", () => {
  it("returns a score between 0 and 100 for every input combination", () => {
    for (const severity of ["critical", "warning", "info"] as const) {
      for (const riskLevel of [0, 1, 2, 3, 4] as const) {
        const score = computeImpactScore({ confidence: 0.5, severity, location: null, riskLevel });
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("higher confidence never decreases the score, all else equal", () => {
    const low = computeImpactScore({ confidence: 0.1, severity: "warning", location: null, riskLevel: 1 });
    const high = computeImpactScore({ confidence: 0.9, severity: "warning", location: null, riskLevel: 1 });
    expect(high).toBeGreaterThan(low);
  });

  it("critical severity scores at least as high as info severity, all else equal", () => {
    const info = computeImpactScore({ confidence: 0.5, severity: "info", location: null, riskLevel: 1 });
    const critical = computeImpactScore({ confidence: 0.5, severity: "critical", location: null, riskLevel: 1 });
    expect(critical).toBeGreaterThan(info);
  });

  it("lower riskLevel (easier to act on) scores at least as high as higher riskLevel, all else equal", () => {
    const easy = computeImpactScore({ confidence: 0.5, severity: "warning", location: null, riskLevel: 0 });
    const hard = computeImpactScore({ confidence: 0.5, severity: "warning", location: null, riskLevel: 4 });
    expect(easy).toBeGreaterThan(hard);
  });

  it("is deterministic — same input always produces the same output", () => {
    const input = { confidence: 0.7, severity: "warning" as const, location: "/software/notion", riskLevel: 2 as const };
    expect(computeImpactScore(input)).toBe(computeImpactScore(input));
  });

  it("resolves a real software slug from a /software/<slug> location without throwing", () => {
    const realSlug = getAllSoftware()[0]?.slug;
    expect(realSlug).toBeTruthy();
    const score = computeImpactScore({ confidence: 0.5, severity: "info", location: `/software/${realSlug}`, riskLevel: 1 });
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("falls back gracefully for a location that isn't a real slug", () => {
    const score = computeImpactScore({ confidence: 0.5, severity: "info", location: "/software/not-a-real-product-xyz", riskLevel: 1 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("impactBucket", () => {
  it("buckets consistently with its own documented thresholds", () => {
    expect(impactBucket(0)).toBe("low");
    expect(impactBucket(39)).toBe("low");
    expect(impactBucket(40)).toBe("medium");
    expect(impactBucket(64)).toBe("medium");
    expect(impactBucket(65)).toBe("high");
    expect(impactBucket(100)).toBe("high");
  });
});
