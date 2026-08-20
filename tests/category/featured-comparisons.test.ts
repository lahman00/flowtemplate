import { describe, expect, it } from "vitest";
import { getCategoryFeaturedComparisons } from "@/lib/category";
import { getAllCategories } from "@/data/categories";
import { getSoftware } from "@/data/software";
import {
  PUBLISHED_COMPARISONS,
  getComparisonsInvolving,
  isPublishedComparison,
} from "@/data/comparisons";
import { ACTIVE_PARTNER_SLUGS } from "@/data/affiliate/active-partners";

describe("Category Featured Comparisons & Editorial Independence", () => {
  const categories = getAllCategories();
  const activeSlugsSet = new Set<string>(ACTIVE_PARTNER_SLUGS);
  activeSlugsSet.add("shopify");
  activeSlugsSet.add("wix");

  it("ensures no duplicate pairs and no reverse-pair collisions in PUBLISHED_COMPARISONS", () => {
    const seen = new Set<string>();
    for (const [a, b] of PUBLISHED_COMPARISONS) {
      const forward = `${a}:${b}`;
      const reverse = `${b}:${a}`;

      expect(seen.has(forward)).toBe(false);
      expect(seen.has(reverse)).toBe(false);

      seen.add(forward);
      expect(a).not.toBe(b);
      expect(getSoftware(a)).toBeDefined();
      expect(getSoftware(b)).toBeDefined();
    }
  });

  it("verifies ServiceTitan graph repair (degree >= 2)", () => {
    const comps = getComparisonsInvolving("servicetitan");
    expect(comps.length).toBeGreaterThanOrEqual(2);
    expect(isPublishedComparison("servicetitan", "jobber")).toBe(true);
    expect(isPublishedComparison("servicetitan", "housecall-pro")).toBe(true);
  });

  it("verifies KrispCall comparison expansion (degree >= 4)", () => {
    const comps = getComparisonsInvolving("krispcall");
    expect(comps.length).toBeGreaterThanOrEqual(4);
    expect(isPublishedComparison("krispcall", "ringcentral")).toBe(true);
    expect(isPublishedComparison("krispcall", "zoom")).toBe(true);
    expect(isPublishedComparison("krispcall", "microsoft-teams")).toBe(true);
    expect(isPublishedComparison("krispcall", "webex")).toBe(true);
  });

  it("surfaces relevant comparisons even when products have zero affiliate monetization", () => {
    // Customer support category currently has zero active affiliates, but should have high-quality featured comparisons
    const supportFeatured = getCategoryFeaturedComparisons("customer-support", 6);
    expect(supportFeatured.length).toBeGreaterThan(0);
    for (const comp of supportFeatured) {
      expect(comp.bothInCat).toBe(true);
      expect(comp.softwareA).toBeDefined();
      expect(comp.softwareB).toBeDefined();
    }

    // Developer tools has zero active affiliates
    const devtoolsFeatured = getCategoryFeaturedComparisons("developer-tools", 6);
    expect(devtoolsFeatured.length).toBeGreaterThan(0);
    for (const comp of devtoolsFeatured) {
      expect(comp.bothInCat).toBe(true);
    }
  });

  it("proves editorial stability when affiliate signals are removed", () => {
    for (const cat of categories) {
      const normal = getCategoryFeaturedComparisons(cat.slug, 6);
      const withoutAffiliates = getCategoryFeaturedComparisons(cat.slug, 6, {
        ignoreAffiliateStatus: true,
      });

      // Both must return valid comparisons
      if (normal.length > 0) {
        expect(withoutAffiliates.length).toBe(normal.length);
        // Intra-category and direct-alternative comparisons must remain prioritized
        for (const comp of withoutAffiliates) {
          expect(comp.bothInCat).toBe(true);
        }
      }
    }
  });

  it("ensures non-affiliate competitors remain visible where editorially appropriate", () => {
    // In communication: Google Meet, Webex, Signal, Telegram have no affiliate program but must appear
    const commFeatured = getCategoryFeaturedComparisons("communication", 6);
    const hasNonAffiliate = commFeatured.some(
      (c) => !activeSlugsSet.has(c.slugA) && !activeSlugsSet.has(c.slugB)
    );
    expect(hasNonAffiliate).toBe(true);

    // In productivity: Things, TickTick, Clockify must appear
    const prodFeatured = getCategoryFeaturedComparisons("productivity", 6);
    const prodHasNonAffiliate = prodFeatured.some(
      (c) => !activeSlugsSet.has(c.slugA) && !activeSlugsSet.has(c.slugB)
    );
    expect(prodHasNonAffiliate).toBe(true);
  });

  it("ensures no program marked rejected, hold, or pending is treated as active", () => {
    // Rejected programs like HubSpot or Brevo, or pending like Freshdesk / Help Scout
    // must NOT be in activeSlugsSet
    expect(activeSlugsSet.has("hubspot")).toBe(false);
    expect(activeSlugsSet.has("brevo")).toBe(false);
    expect(activeSlugsSet.has("freshdesk")).toBe(false);
    expect(activeSlugsSet.has("help-scout")).toBe(false);
    expect(activeSlugsSet.has("clickup")).toBe(false);
  });
});
