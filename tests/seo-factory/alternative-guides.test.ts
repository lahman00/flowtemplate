import { describe, expect, it } from "vitest";
import { ALTERNATIVE_GUIDES } from "@/data/seo/alternative-guides";
import { getSoftware } from "@/data/software";
import { isPublishedComparison } from "@/data/comparisons";

function shingles(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(" ")));
}

function similarity(a: string, b: string): number {
  const left = shingles(a); const right = shingles(b);
  const overlap = [...left].filter((item) => right.has(item)).length;
  return overlap / Math.max(1, new Set([...left, ...right]).size);
}

describe("SEO execution cohort alternatives guides", () => {
  it("contains exactly the approved cohort with valid targets", () => {
    expect(Object.keys(ALTERNATIVE_GUIDES).sort()).toEqual(["airtable", "buffer", "freshdesk", "front", "help-scout", "intercom", "pipedrive", "ringcentral", "semrush"]);
    for (const [slug, guide] of Object.entries(ALTERNATIVE_GUIDES)) {
      expect(getSoftware(slug)).toBeDefined(); expect(guide.decisions).toHaveLength(3); expect(guide.whySeekAlternative).toHaveLength(3);
      for (const decision of guide.decisions) {
        expect(getSoftware(decision.alternativeSlug)).toBeDefined();
        const [a, b] = decision.comparisonSlug.split("-vs-");
        expect(isPublishedComparison(a!, b!)).toBe(true);
      }
    }
  });

  it("does not clone five-word editorial phrases across products", () => {
    const entries = Object.entries(ALTERNATIVE_GUIDES);
    for (let i = 0; i < entries.length; i += 1) for (let j = i + 1; j < entries.length; j += 1) {
      const [leftSlug, left] = entries[i]!; const [rightSlug, right] = entries[j]!;
      const text = (guide: typeof left) => [guide.heading, guide.introduction, ...guide.whySeekAlternative, ...guide.decisions.flatMap((item) => [item.heading, item.fit])].join(" ");
      expect(similarity(text(left), text(right)), `${leftSlug} vs ${rightSlug}`).toBeLessThan(0.08);
    }
  });

  it("stores only first-party evidence URLs", () => {
    for (const guide of Object.values(ALTERNATIVE_GUIDES)) for (const source of guide.evidenceSources) expect(new URL(source).hostname).not.toMatch(/g2|capterra|trustpilot|reddit/i);
  });
});
