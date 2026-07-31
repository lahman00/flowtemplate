"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type TrackedRecommendationLinkProps = ComponentProps<typeof Link> & {
  slug: string;
  rank: number;
  matchPercent: number;
  answersSummary: string;
};

/**
 * Sprint 10 Phase 7 — the "clicked software" half of recommendation
 * analytics (the other two, "generated" and "shown," are recorded
 * server-side when the results page renders). Same best-effort,
 * never-blocks-navigation pattern as components/TrackedCtaLink.tsx.
 */
export function TrackedRecommendationLink({
  slug,
  rank,
  matchPercent,
  answersSummary,
  onClick,
  ...props
}: TrackedRecommendationLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
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
