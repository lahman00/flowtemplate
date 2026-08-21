import { describe, expect, it } from "vitest";
import { ACTIVE_PARTNERS, getActivePartner } from "@/data/affiliate/active-partners";
import { getPartnerMoneyMatrix } from "@/data/affiliate/money-matrix";
import { getSoftware } from "@/data/software";
import { getSoftwareCtaRel, getSoftwareCtaUrl, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { getAffiliateActivation } from "@/lib/revenue/affiliate-manager";

describe("canonical active affiliate partner registry", () => {
  it("contains exactly the 13 verified active partners", () => {
    expect(ACTIVE_PARTNERS).toHaveLength(13);
    expect(new Set(ACTIVE_PARTNERS.map(({ slug }) => slug)).size).toBe(13);
  });

  it.each(ACTIVE_PARTNERS.filter((partner) => partner.affiliateUrl))(
    "$slug resolves its CTA, sponsored rel, and disclosure from the registry",
    (partner) => {
      const software = getSoftware(partner.slug);
      expect(software).toBeDefined();
      expect(getSoftwareCtaUrl(software!)).toBe(partner.affiliateUrl);
      expect(getSoftwareCtaRel(software!)).toBe("sponsored noopener noreferrer");
      expect(shouldShowAffiliateDisclosure(software!)).toBe(true);
    },
  );

  it("Brevo (REJECTED) is not in the canonical registry and gets the ordinary official link, no affiliate CTA", () => {
    // The slug union type no longer includes "brevo" at all — that's itself
    // a compile-time guarantee it was removed, not just an empty runtime find.
    const slugs: readonly string[] = ACTIVE_PARTNERS.map(({ slug }) => slug);
    const software = getSoftware("brevo");

    expect(slugs).not.toContain("brevo");
    expect(getSoftwareCtaUrl(software!)).toBe(software!.website);
    expect(getSoftwareCtaRel(software!)).toBe("noopener noreferrer");
    expect(shouldShowAffiliateDisclosure(software!)).toBe(false);
  });

  it("Miro (HOLD / UNCLEAR) is not in the canonical registry and gets the ordinary official link, no affiliate CTA", () => {
    const slugs: readonly string[] = ACTIVE_PARTNERS.map(({ slug }) => slug);
    const software = getSoftware("miro");

    expect(slugs).not.toContain("miro");
    expect(software!.affiliateUrl).toBeUndefined();
    expect(getSoftwareCtaUrl(software!)).toBe(software!.website);
    expect(getSoftwareCtaRel(software!)).toBe("noopener noreferrer");
    expect(shouldShowAffiliateDisclosure(software!)).toBe(false);
  });

  it("builds a 13-row operational money matrix with no partners blocked", () => {
    const matrix = getPartnerMoneyMatrix();
    expect(matrix).toHaveLength(13);
    expect(matrix.filter(({ revenueReady }) => revenueReady)).toHaveLength(13);
    expect(matrix.filter(({ blocker }) => blocker)).toEqual([]);
    expect(matrix.every(({ coverage }) => coverage.comparisonRoutes > 0)).toBe(true);
    expect(matrix.find(({ slug }) => slug === "krispcall")).toMatchObject({
      url: "https://try.krispcall.com/aikpbrrrl8k9",
      revenueReady: true,
      coverage: { softwareRoute: "/software/krispcall", comparisonRoutes: 7 },
    });
    expect(matrix.find(({ slug }) => slug === "hubstaff")).toMatchObject({
      url: "https://affiliate.hubstaff.com/ca2oe167vcj1",
      revenueReady: true,
      coverage: { softwareRoute: "/software/hubstaff", comparisonRoutes: 8 },
    });
  });

  /**
   * Regression coverage for a real bug found 2026-08-21 while running the
   * full maintenance agent swarm: scripts/maintenance/affiliate.ts's
   * "confirmed affiliate program not activated" check only looked at
   * getAffiliateActivation() (the env-var / config-file mechanism), never
   * at active-partners.ts — even though softwareToAffiliateLink()
   * (lib/affiliate.ts, the resolver that actually decides the live CTA)
   * checks both. Every one of the then-13 real active partners was
   * activated via active-partners.ts, not env vars, so all 13 were
   * wrongly flagged as "not activated," polluting the maintenance report.
   * This asserts the fix's actual combined check (mirroring what the
   * script now does) never flags a real active partner.
   */
  it("no active partner is ever reported as 'not activated' by the affiliate maintenance check", () => {
    for (const partner of ACTIVE_PARTNERS) {
      const activation = getAffiliateActivation(partner.slug);
      const isActive = activation.isActive || Boolean(getActivePartner(partner.slug)?.affiliateUrl);
      expect(isActive, `${partner.slug} is in ACTIVE_PARTNERS but neither activation mechanism reports it active`).toBe(true);
    }
  });
});
