import { NextResponse, type NextRequest } from "next/server";
import { getSoftware } from "@/data/software";
import { getSoftwareCtaUrl } from "@/lib/affiliate";
import { trackSoftwareCtaClick, trackVendorLinkClick } from "@/lib/revenue/click-tracker";
import { WIX_CONTEXTS, getWixAffiliateUrl, type WixFunnelContext } from "@/lib/wix-funnels";

/**
 * Sprint 9 Task 6 — the only entry point components/TrackedCtaLink.tsx
 * talks to. Deliberately trusts nothing the client sends except which
 * software, which page, which UI location, and (for Wix) which funnel
 * context — the actual destination URL and whether it's an affiliate
 * link are recomputed here from server-side data (lib/affiliate.ts,
 * lib/wix-funnels.ts), not taken from the request body. `wixContext` is
 * validated against the known context list before use, so a malformed
 * or spoofed value can never route to an unintended URL — it just falls
 * through to the safe default. Recording itself is a no-op unless
 * NEXT_PUBLIC_REVENUE_TRACKING_ENABLED=true.
 */

type OutboundClickBody = {
  slug?: unknown;
  kind?: unknown;
  sourcePage?: unknown;
  ctaLocation?: unknown;
  wixContext?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
};

function isWixContext(value: unknown): value is WixFunnelContext {
  return typeof value === "string" && (WIX_CONTEXTS as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  let body: OutboundClickBody;

  try {
    body = (await request.json()) as OutboundClickBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { slug, kind, sourcePage, ctaLocation, wixContext } = body;

  if (typeof slug !== "string" || typeof sourcePage !== "string") {
    return NextResponse.json({ error: "slug and sourcePage are required strings" }, { status: 400 });
  }

  const software = getSoftware(slug);
  if (!software) {
    return NextResponse.json({ error: "unknown software slug" }, { status: 404 });
  }

  const resolvedCtaLocation = typeof ctaLocation === "string" ? ctaLocation : undefined;
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "v_anon";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "s_anon";

  if (kind === "vendor-link") {
    await trackVendorLinkClick(software, software.website, sourcePage);
  } else {
    const url = slug === "wix" && isWixContext(wixContext) ? getWixAffiliateUrl(wixContext) : getSoftwareCtaUrl(software);
    await trackSoftwareCtaClick(software, url, sourcePage, resolvedCtaLocation);

    // Also record into first-party analytics event store
    const { recordFirstPartyEvent } = await import("@/lib/analytics/events");
    const { shouldShowAffiliateDisclosure } = await import("@/lib/affiliate");
    const isAffiliate = shouldShowAffiliateDisclosure(software);

    await recordFirstPartyEvent({
      type: "outbound_click",
      softwareSlug: software.slug,
      destination: isAffiliate ? "affiliate" : "official",
      url,
      ctaLocation: resolvedCtaLocation,
      path: sourcePage,
      visitorId,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
