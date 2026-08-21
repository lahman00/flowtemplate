"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";

export function FirstPartyAnalytics() {
  const pathname = usePathname();
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if running in headless automation or prerender
    if (typeof window === "undefined") return;

    // 1. Page view
    trackEvent({
      type: "page_view",
      path: pathname,
      referrer: document.referrer || undefined,
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
