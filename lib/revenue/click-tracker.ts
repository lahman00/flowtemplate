import type { Software } from "@/data/software";
import { isAffiliateLink } from "@/lib/affiliate";
import { recordOutboundEvent, type OutboundEvent } from "@/lib/revenue/events";

/**
 * Sprint 8 Phase 4 — Click Tracker. The capture layer that turns "a user
 * clicked this software's CTA" into an OutboundEvent, sitting on top of
 * lib/affiliate.ts (which already knows whether a given software resolves
 * to an official or affiliate URL) and lib/revenue/events.ts (which
 * decides whether anything actually gets recorded). Not called from any
 * component yet — wiring an onClick handler into the CTA button is the
 * step that turns this from architecture into a live feature, and Sprint 8
 * is explicit that tracking stays off. See docs/revenue.md.
 */

export function trackSoftwareCtaClick(software: Software, resolvedUrl: string): void {
  const event: OutboundEvent = {
    type: isAffiliateLink({ officialUrl: software.website, affiliateUrl: software.affiliateUrl })
      ? "affiliate_link_click"
      : "official_site_click",
    softwareSlug: software.slug,
    destination: software.affiliateUrl ? "affiliate" : "official",
    url: resolvedUrl,
  };

  recordOutboundEvent(event);
}

export function trackVendorLinkClick(software: Software, url: string): void {
  recordOutboundEvent({
    type: "vendor_link_click",
    softwareSlug: software.slug,
    destination: "official",
    url,
  });
}
