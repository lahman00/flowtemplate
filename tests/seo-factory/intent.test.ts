import { describe, expect, it } from "vitest";
import type { Software } from "@/data/software";
import { classifySeoIntent, normalizeQuery, softwareEntitiesForQuery } from "@/lib/seo-factory/intent";

const products = [
  { slug: "pipedrive", name: "Pipedrive" },
  { slug: "hubspot", name: "HubSpot" },
  { slug: "microsoft-teams", name: "Microsoft Teams" },
  { slug: "help-scout", name: "Help Scout" },
  { slug: "craft", name: "Craft" },
  { slug: "craft-cms", name: "Craft CMS" },
] as Software[];

describe("SEO Factory intent classification", () => {
  it.each([
    ["pipedrive", "SOFTWARE_BRAND"], ["pipedrive pricing", "PRICING"], ["pipedrive vs hubspot", "COMPARISON"],
    ["pipedrive alternatives", "ALTERNATIVES"], ["pipedrive review", "REVIEW"], ["pipedrive automation", "FEATURE"],
    ["pipedrive hubspot integration", "INTEGRATION"], ["migrate hubspot to pipedrive", "MIGRATION"],
    ["crm software for small business", "USE_CASE"], ["best crm software", "CATEGORY"], ["is pipedrive worth it", "DECISION"],
    ["how to login to pipedrive", "SUPPORT_HOW_TO"], ["weather tomorrow", "UNKNOWN"],
  ])("classifies %s as %s", (query, intent) => {
    expect(classifySeoIntent(query, softwareEntitiesForQuery(query, products))).toBe(intent);
  });

  it("matches multi-word and internally-capitalized entities deterministically", () => {
    expect(softwareEntitiesForQuery("Microsoft Teams pricing", products).map((item) => item.slug)).toEqual(["microsoft-teams"]);
    expect(normalizeQuery("  HubSpot—VS—Pipedrive ")).toBe("hubspot vs pipedrive");
  });

  it("recognizes compact aliases and prefers the longest specific entity", () => {
    expect(softwareEntitiesForQuery("helpscout alternatives", products).map((item) => item.slug)).toEqual(["help-scout"]);
    expect(softwareEntitiesForQuery("craft cms alternatives", products).map((item) => item.slug)).toEqual(["craft-cms"]);
  });
});
