import { describe, it, expect } from "vitest";
import { getAffiliatePriority, getRankedApplicationCandidates, getAllPriorities } from "@/lib/revenue/affiliate-priority";
import { getSoftware, getAllSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";

describe("affiliate priority scoring", () => {
  it("produces a score within the documented 0-100 range for every product", () => {
    for (const software of getAllSoftware()) {
      const breakdown = getAffiliatePriority(software);
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore).toBeLessThanOrEqual(100);
    }
  });

  it("scores a confirmed program's availability at the maximum", () => {
    const clickup = getSoftware("clickup")!;
    const breakdown = getAffiliatePriority(clickup);
    expect(breakdown.programExists).toBe("yes");
    expect(breakdown.affiliateAvailabilityScore).toBe(10);
  });

  it("scores a product with no research entry at all as no_entry / 0 availability", () => {
    const untouched = getAllSoftware().find((s) => !AFFILIATE_PROGRAMS.some((p) => p.slug === s.slug));
    expect(untouched).toBeDefined();
    const breakdown = getAffiliatePriority(untouched!);
    expect(breakdown.programExists).toBe("no_entry");
    expect(breakdown.affiliateAvailabilityScore).toBe(0);
  });

  it("gives PartnerStack programs the highest approval-friction ease score", () => {
    const clickup = getSoftware("clickup")!; // confirmed PartnerStack program
    const breakdown = getAffiliatePriority(clickup);
    expect(breakdown.approvalFrictionScore).toBe(10);
  });

  it("labels traffic score honestly as 'none' when no real GSC cohort data exists for a slug", () => {
    const zoom = getSoftware("zoom");
    if (zoom) {
      const breakdown = getAffiliatePriority(zoom);
      if (breakdown.trafficOpportunityScore === 0) {
        expect(breakdown.trafficDataSource).toBe("none");
      }
    }
  });

  it("getRankedApplicationCandidates only includes confirmed ('yes') programs", () => {
    const ranked = getRankedApplicationCandidates();
    expect(ranked.length).toBeGreaterThan(0);
    for (const r of ranked) {
      expect(r.programExists).toBe("yes");
    }
  });

  it("getRankedApplicationCandidates is sorted highest score first", () => {
    const ranked = getRankedApplicationCandidates();
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].totalScore).toBeGreaterThanOrEqual(ranked[i].totalScore);
    }
  });

  it("getAllPriorities covers every software product exactly once", () => {
    const all = getAllPriorities();
    expect(all).toHaveLength(getAllSoftware().length);
    const slugs = new Set(all.map((a) => a.slug));
    expect(slugs.size).toBe(all.length);
  });
});
