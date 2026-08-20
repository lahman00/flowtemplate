import { describe, it, expect } from "vitest";
import { ACTIVE_PARTNERS, ACTIVE_PARTNER_SLUGS } from "@/data/affiliate/active-partners";
import { buildCanonicalAffiliateState } from "@/scripts/growth/canonical-affiliate-reconciliation";

describe("Affiliate Source-of-Truth & State Integrity", () => {
  const canonical = buildCanonicalAffiliateState();
  const recordMap = new Map(canonical.records.map(r => [r.slug, r]));

  it("ensures every active partner has a verified non-empty affiliateUrl and is in canonical active-partners.ts", () => {
    for (const partner of ACTIVE_PARTNERS) {
      expect(partner.affiliateUrl).toBeTruthy();
      expect(partner.status).toBe("active");
      expect(partner.blocker).toBeNull();
      const rec = recordMap.get(partner.slug);
      expect(rec).toBeDefined();
      expect(rec?.status).toBe("ACTIVE");
    }
  });

  it("ensures no program is simultaneously ACTIVE and REJECTED", () => {
    const activeSet = new Set(ACTIVE_PARTNER_SLUGS as readonly string[]);
    const rejectedSlugs = canonical.records.filter(r => r.status === "REJECTED").map(r => r.slug);

    for (const slug of rejectedSlugs) {
      expect(activeSet.has(slug)).toBe(false);
    }
  });

  it("ensures no program is simultaneously PENDING_REVIEW and REJECTED", () => {
    const pendingSlugs = canonical.records.filter(r => r.status === "PENDING_REVIEW").map(r => r.slug);
    const rejectedSlugs = new Set(canonical.records.filter(r => r.status === "REJECTED").map(r => r.slug));

    for (const slug of pendingSlugs) {
      expect(rejectedSlugs.has(slug)).toBe(false);
    }
  });

  it("ensures known rejected catalog programs (Webflow, ActiveCampaign, Brevo, HubSpot, Canva, Zapier, n8n) are strictly classified as REJECTED", () => {
    const knownRejections = ["webflow", "activecampaign", "brevo", "hubspot", "canva", "zapier", "n8n"];
    for (const slug of knownRejections) {
      const rec = recordMap.get(slug);
      expect(rec).toBeDefined();
      expect(rec?.status).toBe("REJECTED");
    }
  });

  it("ensures known pending programs (ClickUp, Help Scout, Amplitude, Toggl Track, Freshdesk) are strictly classified as PENDING_REVIEW", () => {
    const knownPending = ["clickup", "help-scout", "amplitude", "toggl-track", "freshdesk"];
    for (const slug of knownPending) {
      const rec = recordMap.get(slug);
      expect(rec?.status).toBe("PENDING_REVIEW");
    }
  });

  it("ensures Setmore has strict compliance note regarding NO PAID MEDIA / PPC", () => {
    const setmoreRec = recordMap.get("setmore");
    expect(setmoreRec?.status).toBe("ACTIVE");
    expect(setmoreRec?.nextAction).toMatch(/NO PAID MEDIA/i);
  });

  it("ensures known form-blocked programs (Xero, Trainual, Tidio) are strictly classified as BLOCKED_FORM_DEFECT", () => {
    const formBlocked = ["xero", "trainual", "tidio"];
    for (const slug of formBlocked) {
      const rec = recordMap.get(slug);
      expect(rec).toBeDefined();
      expect(rec?.status).toBe("BLOCKED_FORM_DEFECT");
    }
  });

  it("ensures known owner-blocked programs (Semrush, LastPass, Zoho CRM, GoHighLevel, QuickBooks) are strictly classified as OWNER_ACTION_REQUIRED", () => {
    const ownerBlocked = ["semrush", "lastpass", "zoho-crm", "gohighlevel", "quickbooks-online"];
    for (const slug of ownerBlocked) {
      const rec = recordMap.get(slug);
      expect(rec).toBeDefined();
      expect(rec?.status).toBe("OWNER_ACTION_REQUIRED");
      expect(rec?.ownerBlocker).toBeTruthy();
    }
  });

  it("ensures no duplicate software slugs exist in canonical affiliate records", () => {
    const slugs = canonical.records.map(r => r.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
    expect(slugs.length).toBe(247);
  });
});
