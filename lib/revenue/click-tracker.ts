import type { Software } from "@/data/software";
import { shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { recordOutboundEvent, type OutboundEvent } from "@/lib/revenue/events";

/**
 * Sprint 8 Phase 4 (architecture) / Sprint 9 Task 6 (wired in) — Click
 * Tracker. The capture layer that turns "a user clicked this software's
 * CTA" into an OutboundEvent, sitting on top of lib/affiliate.ts (which
 * already knows — including any Sprint 9 activation — whether a given
 * software resolves to an official or affiliate URL) and
 * lib/revenue/events.ts (which decides whether anything actually gets
 * recorded, and where). Called from app/api/outbound-click/route.ts,
 * which itself is only reachable via components/TrackedCtaLink.tsx.
 */

export function trackSoftwareCtaClick(software: Software, resolvedUrl: string, sourcePage: string): void {
  const isAffiliate = shouldShowAffiliateDisclosure(software);

  const event: OutboundEvent = {
    type: isAffiliate ? "affiliate_link_click" : "official_site_click",
    softwareSlug: software.slug,
    destination: isAffiliate ? "affiliate" : "official",
    url: resolvedUrl,
  };

  recordOutboundEvent(event, sourcePage);
}

export function trackVendorLinkClick(software: Software, url: string, sourcePage: string): void {
  recordOutboundEvent(
    {
      type: "vendor_link_click",
      softwareSlug: software.slug,
      destination: "official",
      url,
    },
    sourcePage
  );
}
