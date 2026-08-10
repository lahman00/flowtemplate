import { describe, it, expect } from "vitest";
import { generateCategorySynthesis } from "@/lib/category";
import type { Software } from "@/data/software";
import type { Category } from "@/data/categories";

function software(overrides: Partial<Software>): Software {
  return {
    slug: "x",
    name: "X",
    category: "project-management",
    description: "X is a tool.",
    bestFor: "teams",
    website: "https://x.example",
    pricingUrl: "https://x.example/pricing",
    platforms: ["Web"],
    features: ["a"],
    alternatives: [],
    ...overrides,
  } as Software;
}

const category: Category = { slug: "project-management", name: "Project Management", description: "Plan and track work." };

describe("generateCategorySynthesis (Phase 3: category pages should synthesize, not just list)", () => {
  it("falls back to the plain description when there are no members", () => {
    expect(generateCategorySynthesis(category, [])).toBe("Plan and track work.");
  });

  it("computes real platform-coverage numbers from member data", () => {
    const members = [
      software({ slug: "a", platforms: ["Web", "iOS", "Android"] }),
      software({ slug: "b", platforms: ["Web", "Windows", "macOS"] }),
      software({ slug: "c", platforms: ["Web"] }),
    ];
    const result = generateCategorySynthesis(category, members);
    expect(result).toContain("3 tools tracked here, 3 of 3 run in the browser");
    expect(result).toContain("1 have native iOS and Android apps");
    expect(result).toContain("1 also ship Windows and/or macOS desktop apps");
  });

  it("never fabricates a claim for a platform bucket with zero real members", () => {
    const members = [software({ slug: "a", platforms: ["Web"] })];
    const result = generateCategorySynthesis(category, members);
    expect(result).not.toContain("native iOS and Android");
    expect(result).not.toContain("desktop apps");
  });
});
