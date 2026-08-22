"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import type { WixFunnelContext } from "@/lib/wix-funnels";
import { markAndCheckSyntheticQa } from "@/lib/analytics/synthetic";
import { trackEvent } from "@/lib/analytics/track";

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
  const linkRef = useRef<HTMLAnchorElement>(null);
  const hasFiredImpression = useRef(false);

  // WAR MODE mission (2026-08-22) Phase 21/23 — fire cta_impression exactly
  // once, the first time this CTA is actually visible on screen, not just
  // present in the DOM (a CTA below the fold that nobody scrolled to was
  // never "seen"). Phase 23 forensics: the first version of this observed
  // a `display: contents` wrapper span instead of the link itself, on the
  // (wrong) assumption ButtonLink couldn't forward a ref. `display: contents`
  // elements generate no box of their own — getBoundingClientRect on one is
  // always {0,0,0,0} — so IntersectionObserver could never report it as
  // intersecting, and the whole feature silently never fired in production
  // for the ~90 minutes it was live. Proven via a live browser check against
  // miloosh.com: the CTA was 100% on-screen (real getBoundingClientRect
  // confirmed it inside the viewport) yet zero cta_impression events were
  // stored. Fixed by making ButtonLink forward its ref (see that file) to
  // the real, laid-out <a> element and observing that directly.
  useEffect(() => {
    const node = linkRef.current;
    if (!node || hasFiredImpression.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasFiredImpression.current) {
            hasFiredImpression.current = true;
            trackEvent({ type: "cta_impression", path: pathname, softwareSlug: slug, ctaLocation });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pathname, slug, ctaLocation]);

  return (
    <ButtonLink
      {...props}
      ref={linkRef}
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
