import { describe, it, expect } from "vitest";
import { generateMetaDescription, META_DESCRIPTION_MAX_LENGTH } from "@/lib/generators";
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
});
