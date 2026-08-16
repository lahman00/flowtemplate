import { describe, it, expect } from "vitest";
import { interleaveByPillarWeight, generateAllRawIdeas } from "@/lib/social/content-engine";
import type { ContentPillar } from "@/lib/social/types";

/**
 * Regression coverage for a real bug found while seeding the first
 * content batch: ideasFromComparisons() alone produces 1000+ entries
 * (one per published comparison), all listed before any other pillar in
 * generateAllRawIdeas()'s array. A naive "take the first N" selection
 * (exactly what scripts/social/schedule.ts does when picking the next
 * days' posts) would then be almost entirely one pillar, directly
 * contradicting the brief's "Mix... avoid repeating topics too
 * frequently." interleaveByPillarWeight() exists specifically to fix
 * this before any consumer sees the list.
 */
describe("interleaveByPillarWeight", () => {
  it("keeps runs short within the realistic scheduling horizon (the first ~30 items — what schedule.ts actually consumes at a time)", () => {
    // Mirrors the real content engine's actual proportions: two large
    // pillars (comparisons/migration are both 1000+ in production) plus
    // several smaller ones. Deep in the tail, once a higher-weight
    // pillar's pool drains faster than a same-sized lower-weight one, a
    // long same-pillar run becomes mathematically unavoidable (see the
    // next test) — but that only happens far beyond the ~14-30 items
    // schedule.ts actually pulls at a time before the next generate.ts
    // run reshuffles everything, so it's the NEAR-TERM mix that matters.
    const ideas = [
      ...Array.from({ length: 50 }, (_, i) => ({ pillar: "software_decisions" as ContentPillar, topic: `sd-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
      ...Array.from({ length: 50 }, (_, i) => ({ pillar: "migration" as ContentPillar, topic: `mg-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
      ...Array.from({ length: 10 }, (_, i) => ({ pillar: "buyer_education" as ContentPillar, topic: `be-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
      ...Array.from({ length: 10 }, (_, i) => ({ pillar: "trust_methodology" as ContentPillar, topic: `tm-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
    ];
    const weights = { software_decisions: 3, migration: 1, buyer_education: 2, trust_methodology: 1 } as Record<ContentPillar, number>;
    const result = interleaveByPillarWeight(ideas, weights).slice(0, 30);

    let consecutiveRun = 0;
    let maxConsecutiveRun = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i]!.pillar === result[i - 1]!.pillar) {
        consecutiveRun += 1;
        maxConsecutiveRun = Math.max(maxConsecutiveRun, consecutiveRun);
      } else {
        consecutiveRun = 0;
      }
    }
    expect(maxConsecutiveRun).toBeLessThan(4);
  });

  it("known, unavoidable limitation: once every pillar but one is fully exhausted, the remainder is necessarily one long run — there's nothing left to interleave with", () => {
    const ideas = [
      ...Array.from({ length: 50 }, (_, i) => ({ pillar: "software_decisions" as ContentPillar, topic: `sd-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
      ...Array.from({ length: 10 }, (_, i) => ({ pillar: "buyer_education" as ContentPillar, topic: `be-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null })),
    ];
    const result = interleaveByPillarWeight(ideas, { software_decisions: 3, buyer_education: 1 } as Record<ContentPillar, number>);
    // The first 20 (well before buyer_education's 10 items run out) should still be well-mixed.
    const first20Pillars = new Set(result.slice(0, 20).map((i) => i.pillar));
    expect(first20Pillars.size).toBeGreaterThan(1);
  });

  it("preserves every input idea — interleaving reorders, never drops", () => {
    const ideas = Array.from({ length: 37 }, (_, i) => ({ pillar: "category_discovery" as ContentPillar, topic: `t-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null }));
    const result = interleaveByPillarWeight(ideas, { category_discovery: 1 } as Record<ContentPillar, number>);
    expect(result).toHaveLength(37);
  });

  it("a higher-weighted pillar appears earlier and more densely in the first N results than a lower-weighted one", () => {
    const heavy = Array.from({ length: 100 }, (_, i) => ({ pillar: "software_decisions" as ContentPillar, topic: `h-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null }));
    const light = Array.from({ length: 100 }, (_, i) => ({ pillar: "trust_methodology" as ContentPillar, topic: `l-${i}`, sourceSlugs: [], headline: "h", body: "b", link: null }));
    const result = interleaveByPillarWeight([...heavy, ...light], { software_decisions: 5, trust_methodology: 1 } as Record<ContentPillar, number>);
    const first20 = result.slice(0, 20);
    const heavyCount = first20.filter((i) => i.pillar === "software_decisions").length;
    const lightCount = first20.filter((i) => i.pillar === "trust_methodology").length;
    expect(heavyCount).toBeGreaterThan(lightCount);
  });
});

describe("generateAllRawIdeas", () => {
  it("every idea traces to at least one real source, or is an explicitly evergreen (non-product) pillar", () => {
    const ideas = generateAllRawIdeas();
    const evergreenPillars: ContentPillar[] = ["buyer_education", "trust_methodology"];
    for (const idea of ideas) {
      if (evergreenPillars.includes(idea.pillar)) continue;
      expect(idea.sourceSlugs.length).toBeGreaterThan(0);
    }
  });

  it("produces at least the minimum batch size required by the build brief (30 evergreen + 40 pillar-specific)", () => {
    const ideas = generateAllRawIdeas();
    expect(ideas.length).toBeGreaterThanOrEqual(80);
  });
});
