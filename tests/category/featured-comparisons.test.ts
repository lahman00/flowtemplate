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

    // In design: Miro, Figma, Sketch, Whimsical have no affiliate program but appear
    const designFeatured = getCategoryFeaturedComparisons("design", 6);
    const designHasNonAffiliate = designFeatured.some(
      (c) => !activeSlugsSet.has(c.slugA) && !activeSlugsSet.has(c.slugB)
    );
    expect(designHasNonAffiliate).toBe(true);

    // In productivity: non-affiliate software (Clockify, Harvest, Time Doctor, Toggl Track, TickTick, Things) are prominently featured
    const prodFeatured = getCategoryFeaturedComparisons("productivity", 6);
    const prodIncludesNonAffiliates = prodFeatured.every(
      (c) => !activeSlugsSet.has(c.slugA) || !activeSlugsSet.has(c.slugB)
    );
    expect(prodIncludesNonAffiliates).toBe(true);
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

  it("verifies Sprint #2 graph expansion on active partners and low-degree nodes", () => {
    // GoHighLevel: degree increased from 1 to 4
    const ghlComps = getComparisonsInvolving("gohighlevel");
    expect(ghlComps.length).toBeGreaterThanOrEqual(4);
    expect(isPublishedComparison("gohighlevel", "pipedrive")).toBe(true);
    expect(isPublishedComparison("gohighlevel", "zoho-crm")).toBe(true);
    expect(isPublishedComparison("gohighlevel", "activecampaign")).toBe(true);

    // WhatConverts: degree increased from 2 to 4
    const wcComps = getComparisonsInvolving("whatconverts");
    expect(wcComps.length).toBeGreaterThanOrEqual(4);
    expect(isPublishedComparison("pipedrive", "whatconverts")).toBe(true);
    expect(isPublishedComparison("whatconverts", "mixpanel")).toBe(true);

    // Volza: degree increased from 2 to 3
    const volzaComps = getComparisonsInvolving("volza");
    expect(volzaComps.length).toBeGreaterThanOrEqual(3);
    expect(isPublishedComparison("volza", "google-analytics")).toBe(true);

    // Pipedrive: degree increased from 8 to 12
    const pdComps = getComparisonsInvolving("pipedrive");
    expect(pdComps.length).toBeGreaterThanOrEqual(12);
    expect(isPublishedComparison("monday", "pipedrive")).toBe(true);
    expect(isPublishedComparison("airtable", "pipedrive")).toBe(true);
  });

  it("verifies Sprint #3 graph expansion on high-intent substitutes and active-partner routing", () => {
    // GoHighLevel: degree increased from 4 to 7
    const ghlComps = getComparisonsInvolving("gohighlevel");
    expect(ghlComps.length).toBeGreaterThanOrEqual(7);
    expect(isPublishedComparison("gohighlevel", "keap")).toBe(true);
    expect(isPublishedComparison("gohighlevel", "close")).toBe(true);
    expect(isPublishedComparison("gohighlevel", "freshsales")).toBe(true);

    // Obsidian: degree increased from 5 to 6
    const obsComps = getComparisonsInvolving("obsidian");
    expect(obsComps.length).toBeGreaterThanOrEqual(6);
    expect(isPublishedComparison("obsidian", "microsoft-onenote")).toBe(true);

    // Moosend: degree increased from 6 to 8
    const mooComps = getComparisonsInvolving("moosend");
    expect(mooComps.length).toBeGreaterThanOrEqual(8);
    expect(isPublishedComparison("moosend", "marketo-engage")).toBe(true);
    expect(isPublishedComparison("moosend", "braze")).toBe(true);

    // Setmore: degree increased from 9 to 10
    const setmoreComps = getComparisonsInvolving("setmore");
    expect(setmoreComps.length).toBeGreaterThanOrEqual(10);
    expect(isPublishedComparison("setmore", "hubspot")).toBe(true);

    // KrispCall: degree increased from 4 to 5
    const kcComps = getComparisonsInvolving("krispcall");
    expect(kcComps.length).toBeGreaterThanOrEqual(5);
    expect(isPublishedComparison("krispcall", "google-meet")).toBe(true);
  });

  it("verifies Sprint #4 developer tools and API documentation graph authority", () => {
    // Sentry & Datadog vs PostHog
    expect(isPublishedComparison("sentry", "posthog")).toBe(true);
    expect(isPublishedComparison("datadog", "posthog")).toBe(true);

    // API documentation portals & GitBook
    expect(isPublishedComparison("readme", "gitbook")).toBe(true);
    expect(isPublishedComparison("swaggerhub", "gitbook")).toBe(true);
    expect(isPublishedComparison("postman", "readme")).toBe(true);
    expect(isPublishedComparison("archbee", "gitbook")).toBe(true);

    // WorkOS vs Duo Security
    expect(isPublishedComparison("workos", "duo-security")).toBe(true);

    // Verify degree increases
    expect(getComparisonsInvolving("gitbook").length).toBeGreaterThanOrEqual(15);
    expect(getComparisonsInvolving("posthog").length).toBeGreaterThanOrEqual(13);
    expect(getComparisonsInvolving("readme").length).toBeGreaterThanOrEqual(12);
  });

  it("verifies Sprint #5 design systems, visual whiteboarding & structured workspace authority", () => {
    // Visual whiteboards vs Notion
    expect(isPublishedComparison("miro", "notion")).toBe(true);
    expect(isPublishedComparison("whimsical", "notion")).toBe(true);
    expect(isPublishedComparison("lucidchart", "notion")).toBe(true);

    // Design tools & handoff vs Zeroheight
    expect(isPublishedComparison("figma", "zeroheight")).toBe(true);
    expect(isPublishedComparison("zeplin", "zeroheight")).toBe(true);
    expect(isPublishedComparison("sketch", "zeroheight")).toBe(true);

    // Verify degree increases
    expect(getComparisonsInvolving("zeroheight").length).toBeGreaterThanOrEqual(13);
    expect(getComparisonsInvolving("miro").length).toBeGreaterThanOrEqual(9);
    expect(getComparisonsInvolving("figma").length).toBeGreaterThanOrEqual(11);
    expect(getComparisonsInvolving("zeplin").length).toBeGreaterThanOrEqual(9);
  });

  it("verifies Time Tracking & Workforce Management cluster authority and Hubstaff monetization", () => {
    // Hubstaff active comparisons
    expect(isPublishedComparison("hubstaff", "toggl-track")).toBe(true);
    expect(isPublishedComparison("hubstaff", "clockify")).toBe(true);
    expect(isPublishedComparison("hubstaff", "harvest")).toBe(true);
    expect(isPublishedComparison("hubstaff", "time-doctor")).toBe(true);

    // Core time tracking & invoicing comparisons
    expect(isPublishedComparison("toggl-track", "harvest")).toBe(true);
    expect(isPublishedComparison("toggl-track", "time-doctor")).toBe(true);
    expect(isPublishedComparison("clockify", "harvest")).toBe(true);
    expect(isPublishedComparison("clockify", "time-doctor")).toBe(true);
    expect(isPublishedComparison("harvest", "time-doctor")).toBe(true);

    // Project management bridges
    expect(isPublishedComparison("hubstaff", "todoist")).toBe(true);
    expect(isPublishedComparison("hubstaff", "monday")).toBe(true);
    expect(isPublishedComparison("hubstaff", "asana")).toBe(true);
    expect(isPublishedComparison("hubstaff", "clickup")).toBe(true);
    expect(isPublishedComparison("harvest", "asana")).toBe(true);

    // Verify degree metrics
    expect(getComparisonsInvolving("hubstaff").length).toBeGreaterThanOrEqual(8);
    expect(getComparisonsInvolving("harvest").length).toBeGreaterThanOrEqual(4);
    expect(getComparisonsInvolving("time-doctor").length).toBeGreaterThanOrEqual(4);
    expect(getComparisonsInvolving("toggl-track").length).toBeGreaterThanOrEqual(11);
    expect(getComparisonsInvolving("clockify").length).toBeGreaterThanOrEqual(14);
  });

  it("verifies Accounting & SMB Finance cluster authority (QuickBooks, Xero, FreshBooks, Wave, Zoho Books)", () => {
    // Core SMB accounting comparisons
    expect(isPublishedComparison("quickbooks-online", "freshbooks")).toBe(true);
    expect(isPublishedComparison("quickbooks-online", "wave")).toBe(true);
    expect(isPublishedComparison("quickbooks-online", "zoho-books")).toBe(true);
    expect(isPublishedComparison("xero", "freshbooks")).toBe(true);
    expect(isPublishedComparison("xero", "wave")).toBe(true);
    expect(isPublishedComparison("xero", "zoho-books")).toBe(true);
    expect(isPublishedComparison("freshbooks", "wave")).toBe(true);
    expect(isPublishedComparison("freshbooks", "zoho-books")).toBe(true);
    expect(isPublishedComparison("wave", "zoho-books")).toBe(true);

    // Invoicing & time tracking bridges
    expect(isPublishedComparison("freshbooks", "harvest")).toBe(true);
    expect(isPublishedComparison("freshbooks", "toggl-track")).toBe(true);
    expect(isPublishedComparison("freshbooks", "clockify")).toBe(true);
    expect(isPublishedComparison("wave", "harvest")).toBe(true);

    // Verify degree expansions
    expect(getComparisonsInvolving("quickbooks-online").length).toBeGreaterThanOrEqual(4);
    expect(getComparisonsInvolving("xero").length).toBeGreaterThanOrEqual(4);
    expect(getComparisonsInvolving("freshbooks").length).toBeGreaterThanOrEqual(6);
    expect(getComparisonsInvolving("wave").length).toBeGreaterThanOrEqual(5);
    expect(getComparisonsInvolving("zoho-books").length).toBeGreaterThanOrEqual(4);
  });
});
