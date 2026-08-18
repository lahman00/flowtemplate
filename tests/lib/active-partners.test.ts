import { describe, expect, it } from "vitest";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";
import { getPartnerMoneyMatrix } from "@/data/affiliate/money-matrix";
import { getSoftware } from "@/data/software";
import { getSoftwareCtaRel, getSoftwareCtaUrl, shouldShowAffiliateDisclosure } from "@/lib/affiliate";

describe("canonical active affiliate partner registry", () => {
  it("contains exactly the 11 verified active partners", () => {
    expect(ACTIVE_PARTNERS).toHaveLength(11);
    expect(new Set(ACTIVE_PARTNERS.map(({ slug }) => slug)).size).toBe(11);
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

  it("keeps Brevo on its official URL until a legitimate affiliate URL exists", () => {
    const partner = ACTIVE_PARTNERS.find(({ slug }) => slug === "brevo");
    const software = getSoftware("brevo");

    expect(partner).toMatchObject({ affiliateUrl: null, blocker: "missing_affiliate_url" });
    expect(getSoftwareCtaUrl(software!)).toBe(software!.website);
    expect(getSoftwareCtaRel(software!)).toBe("noopener noreferrer");
    expect(shouldShowAffiliateDisclosure(software!)).toBe(false);
  });

  it("builds an 11-row operational money matrix with only Brevo blocked", () => {
    const matrix = getPartnerMoneyMatrix();
    expect(matrix).toHaveLength(11);
    expect(matrix.filter(({ revenueReady }) => revenueReady)).toHaveLength(10);
    expect(matrix.filter(({ blocker }) => blocker)).toEqual([
      expect.objectContaining({ slug: "brevo", blocker: "missing_affiliate_url" }),
    ]);
    expect(matrix.every(({ coverage }) => coverage.comparisonRoutes > 0)).toBe(true);
  });
});
