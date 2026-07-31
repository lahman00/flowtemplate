import type { Software } from "@/data/software";

/**
 * Phase 4 — reusable affiliate-link architecture. No entry in
 * data/software currently sets affiliate_url, so every function here
 * resolves to the plain official_url today — see docs/monetization.md.
 */

export type AffiliateLink = {
  officialUrl: string;
  affiliateUrl?: string;
};

/** The URL a "visit site" CTA should use. Falls back to official_url whenever affiliate_url is empty — never returns an empty string. */
export function preferredUrl(link: AffiliateLink): string {
  return link.affiliateUrl || link.officialUrl;
}

export function isAffiliateLink(link: AffiliateLink): boolean {
  return Boolean(link.affiliateUrl);
}

/** rel attribute for the CTA link — only claims "sponsored" when it's genuinely an affiliate link. */
export function affiliateRel(link: AffiliateLink): string {
  return isAffiliateLink(link) ? "sponsored noopener noreferrer" : "noopener noreferrer";
}

/**
 * Appends tracking parameters to a URL. Intended for affiliate links only —
 * official links are never tagged. No params are applied unless explicitly
 * configured (see getConfiguredTrackingParams); nothing here is fabricated.
 */
export function withTrackingParams(url: string, params: Record<string, string>): string {
  if (Object.keys(params).length === 0) {
    return url;
  }

  try {
    const parsed = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      parsed.searchParams.set(key, value);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Reads an optional affiliate tracking parameter from environment config —
 * e.g. an affiliate network's ref code. Empty unless
 * NEXT_PUBLIC_AFFILIATE_REF is set; nothing is hardcoded, so this is a
 * no-op today.
 */
export function getConfiguredTrackingParams(): Record<string, string> {
  const ref = process.env.NEXT_PUBLIC_AFFILIATE_REF;
  return ref ? { ref } : {};
}

function softwareToAffiliateLink(software: Software): AffiliateLink {
  return { officialUrl: software.website, affiliateUrl: software.affiliateUrl };
}

/** The CTA URL for a software entry — the affiliate link (with tracking params, if configured) when one exists, otherwise the plain official site. */
export function getSoftwareCtaUrl(software: Software): string {
  const link = softwareToAffiliateLink(software);
  const url = preferredUrl(link);
  return isAffiliateLink(link) ? withTrackingParams(url, getConfiguredTrackingParams()) : url;
}

export function getSoftwareCtaRel(software: Software): string {
  return affiliateRel(softwareToAffiliateLink(software));
}

/** Whether this entry's CTA is a genuine affiliate link — used to decide whether to show an inline disclosure note next to it. */
export function shouldShowAffiliateDisclosure(software: Software): boolean {
  return isAffiliateLink(softwareToAffiliateLink(software));
}
