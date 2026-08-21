"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics/track";

type TrackedRecommendationLinkProps = ComponentProps<typeof Link> & {
  slug: string;
  rank: number;
  matchPercent: number;
  answersSummary: string;
  domain: string;
};

/**
 * Sprint 10 Phase 7 — the "clicked software" half of recommendation
 * analytics (the other two, "generated" and "shown," are recorded
 * server-side when the results page renders). Same best-effort,
 * never-blocks-navigation pattern as components/TrackedCtaLink.tsx.
 *
 * Recommend Engine Integrity Patch (2026-08-21): also fires
 * recommend_product_open on the new first-party events pipeline
 * (anonymous visitor/session IDs, funnel-joinable with recommend_started/
 * recommend_completed/recommend_result_viewed) alongside the existing
 * /api/recommendation-click call, which stays as-is for the older
 * /internal/recommendations report.
 */
export function TrackedRecommendationLink({
  slug,
  rank,
  matchPercent,
  answersSummary,
  domain,
  onClick,
  ...props
}: TrackedRecommendationLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        trackEvent({
          type: "recommend_product_open",
          path: "/recommend/results",
          softwareSlug: slug,
          rank,
          domain,
        });
        void fetch("/api/recommendation-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, rank, matchPercent, answersSummary }),
          keepalive: true,
        }).catch(() => {
          // Best-effort only — a tracking failure must never affect the user's click.
        });
      }}
    />
  );
}
