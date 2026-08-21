"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { extractReferrerHost, normalizeTrafficSource } from "@/lib/analytics/attribution";

const ATTRIBUTION_CAPTURED_KEY = "miloosh_attribution_captured";

/**
 * Analytics Zero-Drop Production Proof Mega Mission (2026-08-21) Phase 8:
 * attribution is a landing-page property, not a per-pageview one — UTM
 * params only ever appear on the entry URL, and re-deriving traffic
 * source from an internal navigation's absent referrer/UTMs would
 * wrongly reclassify an already-attributed session as "direct" on its
 * second page view. Captured once per browser tab session (sessionStorage-
 * gated, same pattern as lib/analytics/synthetic.ts's QA marker).
 */
function captureLandingAttribution(): { referrerHost?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string; trafficSource: ReturnType<typeof normalizeTrafficSource> } | null {
  try {
    if (sessionStorage.getItem(ATTRIBUTION_CAPTURED_KEY) === "1") return null;
    sessionStorage.setItem(ATTRIBUTION_CAPTURED_KEY, "1");

    const params = new URLSearchParams(window.location.search);
    const referrerHost = extractReferrerHost(document.referrer);
    const utmSource = params.get("utm_source")?.slice(0, 64) || undefined;
    const utmMedium = params.get("utm_medium")?.slice(0, 64) || undefined;
    const utmCampaign = params.get("utm_campaign")?.slice(0, 64) || undefined;

    return {
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
      trafficSource: normalizeTrafficSource({ referrerHost, utmSource, utmMedium }),
    };
  } catch {
    return null;
  }
}

export function FirstPartyAnalytics() {
  const pathname = usePathname();
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if running in headless automation or prerender
    if (typeof window === "undefined") return;

    // 1. Page view — attribution fields only attached on this tab
    // session's first page view (see captureLandingAttribution above).
    trackEvent({
      type: "page_view",
      path: pathname,
      ...captureLandingAttribution(),
    });

    // 2. Specialized page views
    if (pathname.startsWith("/software/")) {
      const softwareSlug = pathname.replace("/software/", "").split("/")[0];
      if (softwareSlug) {
        trackEvent({ type: "software_view", path: pathname, softwareSlug });
      }
    } else if (pathname.startsWith("/compare/") && pathname !== "/compare") {
      const comparisonSlug = pathname.replace("/compare/", "").split("/")[0];
      if (comparisonSlug) {
        trackEvent({ type: "comparison_view", path: pathname, comparisonSlug });
      }
    } else if (pathname.startsWith("/categories/")) {
      const categorySlug = pathname.replace("/categories/", "").split("/")[0];
      if (categorySlug) {
        trackEvent({ type: "category_view", path: pathname, categorySlug });
      }
    } else if (pathname.startsWith("/guides/") || pathname.startsWith("/alternatives/")) {
      const guideSlug = pathname.replace(/^\/(guides|alternatives)\//, "").split("/")[0];
      if (guideSlug) {
        trackEvent({ type: "guide_view", path: pathname, guideSlug });
      }
    } else if (pathname.startsWith("/recommend/results")) {
      trackEvent({ type: "recommend_use", path: pathname });
    }

    // 3. Engaged view timer (>10 seconds on page)
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    dwellTimerRef.current = setTimeout(() => {
      trackEvent({ type: "engaged_view", path: pathname, durationSeconds: 10 });
    }, 10000);

    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [pathname]);

  return null;
}
