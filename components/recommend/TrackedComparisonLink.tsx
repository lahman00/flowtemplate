"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics/track";

type TrackedComparisonLinkProps = ComponentProps<typeof Link> & {
  comparisonSlug: string;
  domain: string;
};

/**
 * Recommend Engine Integrity Patch (2026-08-21) — Phase 7's
 * recommend_comparison_open, the "See it compared" links on a result
 * card. Same best-effort, never-blocks-navigation pattern as
 * TrackedRecommendationLink.
 */
export function TrackedComparisonLink({ comparisonSlug, domain, onClick, ...props }: TrackedComparisonLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        trackEvent({
          type: "recommend_comparison_open",
          path: "/recommend/results",
          comparisonSlug,
          domain,
        });
      }}
    />
  );
}
