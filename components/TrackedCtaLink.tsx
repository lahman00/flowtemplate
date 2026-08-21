"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import type { WixFunnelContext } from "@/lib/wix-funnels";
import { markAndCheckSyntheticQa } from "@/lib/analytics/synthetic";

type TrackedCtaLinkProps = ComponentProps<typeof ButtonLink> & {
  /** The software slug this CTA points at — resolved server-side, never trusted from the client alone. */
  slug: string;
  /** Where on the page this CTA lives, e.g. "software-page-cta" or "compare-page-choose-card" — a click-tracking dimension only, purely descriptive. */
  ctaLocation?: string;
  /** For Wix specifically: which of the four funnels this placement is about. Ignored (and the server falls back to the safe default) for every other slug or an unrecognized value. */
  wixContext?: WixFunnelContext;
};

/**
 * Sprint 9 Task 6 — the only client boundary needed to fire an outbound-
 * click event: a Server Component page can't attach an onClick handler
 * directly (functions can't cross the server/client boundary), so this
 * thin wrapper is where that happens. Fires a best-effort, non-blocking
 * POST to /api/outbound-click on click; never prevents the link's default
 * navigation, and a failed request doesn't affect the user's click in any
 * way. See lib/revenue/events.ts — recording itself stays a no-op unless
 * NEXT_PUBLIC_REVENUE_TRACKING_ENABLED=true.
 */
export function TrackedCtaLink({ slug, ctaLocation, wixContext, onClick, ...props }: TrackedCtaLinkProps) {
  const pathname = usePathname();

  return (
    <ButtonLink
      {...props}
      onClick={(event) => {
        onClick?.(event);
        const visitorId = typeof localStorage !== "undefined" ? localStorage.getItem("miloosh_vid") ?? undefined : undefined;
        const sessionId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("miloosh_sid") ?? undefined : undefined;
        const isTest = markAndCheckSyntheticQa();
        void fetch("/api/outbound-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, kind: "cta", sourcePage: pathname, ctaLocation, wixContext, visitorId, sessionId, isTest }),
          keepalive: true,
        }).catch(() => {
          // Best-effort only — a tracking failure must never affect the user's click.
        });
      }}
    />
  );
}
