"use client";

import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { ButtonLink } from "@/components/ButtonLink";

type TrackedCtaLinkProps = ComponentProps<typeof ButtonLink> & {
  /** The software slug this CTA points at — resolved server-side, never trusted from the client alone. */
  slug: string;
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
export function TrackedCtaLink({ slug, onClick, ...props }: TrackedCtaLinkProps) {
  const pathname = usePathname();

  return (
    <ButtonLink
      {...props}
      onClick={(event) => {
        onClick?.(event);
        void fetch("/api/outbound-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, kind: "cta", sourcePage: pathname }),
          keepalive: true,
        }).catch(() => {
          // Best-effort only — a tracking failure must never affect the user's click.
        });
      }}
    />
  );
}
