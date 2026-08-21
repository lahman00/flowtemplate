"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateVisitorId(): string {
  try {
    const key = "miloosh_vid";
    let vid = localStorage.getItem(key);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(key, vid);
    }
    return vid;
  } catch {
    return "v_anon_" + Math.random().toString(36).slice(2, 10);
  }
}

function getOrCreateSessionId(): string {
  try {
    const key = "miloosh_sid";
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "s_anon_" + Math.random().toString(36).slice(2, 10);
  }
}

function sendBeaconEvent(data: Record<string, unknown>) {
  try {
    const body = JSON.stringify(data);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
    } else {
      fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // silent fail
      });
    }
  } catch {
    // silent fail
  }
}

export function FirstPartyAnalytics() {
  const pathname = usePathname();
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if running in headless automation or prerender
    if (typeof window === "undefined") return;

    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();

    // 1. Page view
    sendBeaconEvent({
      type: "page_view",
      path: pathname,
      referrer: document.referrer || undefined,
      visitorId,
      sessionId,
    });

    // 2. Specialized page views
    if (pathname.startsWith("/software/")) {
      const softwareSlug = pathname.replace("/software/", "").split("/")[0];
      if (softwareSlug) {
        sendBeaconEvent({
          type: "software_view",
          path: pathname,
          softwareSlug,
          visitorId,
          sessionId,
        });
      }
    } else if (pathname.startsWith("/compare/") && pathname !== "/compare") {
      const comparisonSlug = pathname.replace("/compare/", "").split("/")[0];
      if (comparisonSlug) {
        sendBeaconEvent({
          type: "comparison_view",
          path: pathname,
          comparisonSlug,
          visitorId,
          sessionId,
        });
      }
    } else if (pathname.startsWith("/categories/")) {
      const categorySlug = pathname.replace("/categories/", "").split("/")[0];
      if (categorySlug) {
        sendBeaconEvent({
          type: "category_view",
          path: pathname,
          categorySlug,
          visitorId,
          sessionId,
        });
      }
    } else if (pathname.startsWith("/guides/") || pathname.startsWith("/alternatives/")) {
      const guideSlug = pathname.replace(/^\/(guides|alternatives)\//, "").split("/")[0];
      if (guideSlug) {
        sendBeaconEvent({
          type: "guide_view",
          path: pathname,
          guideSlug,
          visitorId,
          sessionId,
        });
      }
    } else if (pathname.startsWith("/recommend/results")) {
      sendBeaconEvent({
        type: "recommend_use",
        path: pathname,
        visitorId,
        sessionId,
      });
    }

    // 3. Engaged view timer (>10 seconds on page)
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    dwellTimerRef.current = setTimeout(() => {
      sendBeaconEvent({
        type: "engaged_view",
        path: pathname,
        durationSeconds: 10,
        visitorId,
        sessionId,
      });
    }, 10000);

    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [pathname]);

  return null;
}
