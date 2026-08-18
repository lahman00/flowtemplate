import { getComparisonsInvolving } from "@/data/comparisons";
import { getSoftware } from "@/data/software";
import { getSoftwareCtaRel, getSoftwareCtaUrl, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";

export type PartnerMoneyMatrixRow = {
  partner: string;
  slug: string;
  status: "active";
  url: string | null;
  coverage: { softwareRoute: string; comparisonRoutes: number };
  cta: string;
  tracking: boolean;
  disclosure: boolean;
  revenueReady: boolean;
  blocker: string | null;
  nextAction: string;
};

export function getPartnerMoneyMatrix(): PartnerMoneyMatrixRow[] {
  return ACTIVE_PARTNERS.map((partner) => {
    const software = getSoftware(partner.slug);
    if (!software) throw new Error(`Active affiliate partner has no software record: ${partner.slug}`);

    const url = partner.affiliateUrl;
    const disclosure = shouldShowAffiliateDisclosure(software);
    const sponsored = getSoftwareCtaRel(software) === "sponsored noopener noreferrer";
    const tracking = true; // Both software and comparison CTAs use TrackedCtaLink.

    return {
      partner: software.name,
      slug: partner.slug,
      status: partner.status,
      url,
      coverage: {
        softwareRoute: `/software/${partner.slug}`,
        comparisonRoutes: getComparisonsInvolving(partner.slug).length,
      },
      cta: url ? `Visit ${software.name}` : "Visit official site",
      tracking,
      disclosure,
      revenueReady: Boolean(url && disclosure && sponsored && tracking && getSoftwareCtaUrl(software) === url),
      blocker: partner.blocker,
      nextAction: url
        ? "Monitor outbound clicks and conversions; refresh commercial facts on schedule."
        : "Obtain and verify the Brevo affiliate URL, then add it to the canonical registry.",
    };
  });
}
