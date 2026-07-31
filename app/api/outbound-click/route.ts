import { NextResponse, type NextRequest } from "next/server";
import { getSoftware } from "@/data/software";
import { getSoftwareCtaUrl } from "@/lib/affiliate";
import { trackSoftwareCtaClick, trackVendorLinkClick } from "@/lib/revenue/click-tracker";

/**
 * Sprint 9 Task 6 — the only entry point components/TrackedCtaLink.tsx
 * talks to. Deliberately trusts nothing the client sends except which
 * software and which page — the actual destination URL and whether it's
 * an affiliate link are recomputed here from server-side data
 * (lib/affiliate.ts), not taken from the request body. Recording itself
 * is a no-op unless NEXT_PUBLIC_REVENUE_TRACKING_ENABLED=true.
 */

type OutboundClickBody = {
  slug?: unknown;
  kind?: unknown;
  sourcePage?: unknown;
};

export async function POST(request: NextRequest) {
  let body: OutboundClickBody;

  try {
    body = (await request.json()) as OutboundClickBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { slug, kind, sourcePage } = body;

  if (typeof slug !== "string" || typeof sourcePage !== "string") {
    return NextResponse.json({ error: "slug and sourcePage are required strings" }, { status: 400 });
  }

  const software = getSoftware(slug);
  if (!software) {
    return NextResponse.json({ error: "unknown software slug" }, { status: 404 });
  }

  if (kind === "vendor-link") {
    trackVendorLinkClick(software, software.website, sourcePage);
  } else {
    trackSoftwareCtaClick(software, getSoftwareCtaUrl(software), sourcePage);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
