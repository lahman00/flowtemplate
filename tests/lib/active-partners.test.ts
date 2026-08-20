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

  it("builds an 11-row operational money matrix with no partners blocked", () => {
    const matrix = getPartnerMoneyMatrix();
    expect(matrix).toHaveLength(11);
    expect(matrix.filter(({ revenueReady }) => revenueReady)).toHaveLength(11);
    expect(matrix.filter(({ blocker }) => blocker)).toEqual([]);
    expect(matrix.every(({ coverage }) => coverage.comparisonRoutes > 0)).toBe(true);
    expect(matrix.find(({ slug }) => slug === "krispcall")).toMatchObject({
      url: "https://try.krispcall.com/aikpbrrrl8k9",
      revenueReady: true,
      coverage: { softwareRoute: "/software/krispcall", comparisonRoutes: 4 },
    });
  });
});
