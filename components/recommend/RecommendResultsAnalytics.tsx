"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { RecommendationConfidence } from "@/lib/recommend/types";

type RecommendResultsAnalyticsProps = {
  domain: string;
  confidence: RecommendationConfidence;
  resultCount: number;
};

/**
 * Recommend Engine Integrity Patch (2026-08-21) — Phase 7. The results
 * page (app/recommend/results/page.tsx) is a server component, so this
 * tiny client component is the mount point for the one client-side event
 * that page needs to fire: recommend_result_viewed. Renders nothing.
 */
export function RecommendResultsAnalytics({ domain, confidence, resultCount }: RecommendResultsAnalyticsProps) {
  useEffect(() => {
    trackEvent({
      type: "recommend_result_viewed",
      path: "/recommend/results",
      domain,
      confidence,
      resultCount,
    });
    // Fire once per mount of a given result set — deliberately not
    // re-firing on prop identity changes within the same navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
