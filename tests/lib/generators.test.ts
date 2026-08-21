import { describe, it, expect } from "vitest";
import { generateMetaDescription, META_DESCRIPTION_MAX_LENGTH, generateChoosingGuide } from "@/lib/generators";
import type { Software } from "@/data/software";

function software(overrides: Partial<Software>): Software {
  return {
    slug: "x",
    name: "X",
    category: "project-management",
    description: "X is a tool.",
    bestFor: "teams",
    website: "https://x.example",
    pricingUrl: "https://x.example/pricing",
    alternatives: [],
    ...overrides,
  } as Software;
}

describe("generateMetaDescription", () => {
  it("appends the alternatives CTA when the combined text fits the SERP budget", () => {
    const s = software({ description: "Notion combines docs and databases.", alternatives: [{ name: "A" } as never, { name: "B" } as never] });
    const result = generateMetaDescription(s);
    expect(result).toContain("Compare 2 real alternatives");
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(false);
  });

  it("never truncates a description that fits on its own, even without the CTA fitting (regression: the CTA used to always be appended first, wasting the whole budget on boilerplate that then got sliced away)", () => {
    const description = "A".repeat(140) + " end.";
    const s = software({ description, alternatives: [{ name: "A" } as never] });
    const result = generateMetaDescription(s);
    expect(result).toBe(description);
  });

  it("truncates at a word boundary with an ellipsis only when the description itself exceeds the budget", () => {
    const description = "word ".repeat(60).trim();
    const s = software({ description, alternatives: [{ name: "A" } as never] });
    const result = generateMetaDescription(s);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("Compare");
  });

  /**
   * Regression (2026-08-21 growth sprint, real finding from the full agent
   * swarm: "Meta description template truncates 84% of software pages,
   * 207/247 ending mid-sentence"): this catalog's descriptions are
   * consistently one long comma-joined sentence with no early period, so
   * truncation always lands mid-sentence — that part's unavoidable given
   * real content length, not a bug. But 34 of those 207 landed right after
   * a comma/semicolon ("...manage sales,…"), which reads worse than
   * landing on a plain word — that part is a real, fixable defect.
   */
  it("never leaves a dangling comma/semicolon right before the ellipsis when truncating", () => {
    const description =
      "HubSpot CRM is a customer-relationship platform where businesses store contact and company data, track deals through a sales pipeline, and manage sales, marketing, and service activity, with AI assistance built in.";
    const s = software({ description, alternatives: [{ name: "A" } as never] });
    const result = generateMetaDescription(s);
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH);
    expect(result.endsWith("…")).toBe(true);
    expect(result).toMatch(/[^,;:]…$/);
  });
});

describe("generateChoosingGuide (Operation First Click, 2026-08-14: real per-alternative data instead of fixed boilerplate)", () => {
  it("names each real listed alternative and its own sourced bestFor text verbatim", () => {
    const s = software({
      name: "Sprout Social",
      alternatives: [
        { name: "Hootsuite", slug: "hootsuite", description: "d", bestFor: "Social media managers and enterprises.", strengths: ["a"] },
        { name: "Buffer", slug: "buffer", description: "d", bestFor: "Creators and small businesses.", strengths: ["a"] },
      ],
    });
    const result = generateChoosingGuide(s);
    expect(result).toContain("Hootsuite (Social media managers and enterprises)");
    expect(result).toContain("Buffer (Creators and small businesses)");
    expect(result).toContain("Sprout Social");
  });

  it("never lowercases bestFor's first letter — regression: comparison.ts hit this exact bug when a product's own name opens the sentence (e.g. 'HubSpot positions...' -> 'hubSpot positions...')", () => {
    const s = software({
      alternatives: [{ name: "HubSpot", slug: "hubspot", description: "d", bestFor: "HubSpot positions itself for growing teams.", strengths: ["a"] }],
    });
    const result = generateChoosingGuide(s);
    expect(result).toContain("HubSpot positions itself for growing teams");
    expect(result).not.toContain("hubSpot positions");
  });

  it("falls back to the generic guidance only when there are genuinely no alternatives on record", () => {
    const s = software({ alternatives: [] });
    const result = generateChoosingGuide(s);
    expect(result).toContain("Start with the workflow you need to improve");
  });

  it("still includes the platforms note when platforms are set", () => {
    const s = software({ platforms: ["Web", "macOS"], alternatives: [{ name: "A", slug: "a", description: "d", bestFor: "teams", strengths: ["x"] }] });
    const result = generateChoosingGuide(s);
    expect(result).toContain("Web, macOS");
  });
});
