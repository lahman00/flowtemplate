import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";

export const runtime = "edge";

/**
 * Phase 6 visual engine — one reusable, parameterized card generator
 * instead of eight near-duplicate static templates, since every required
 * card type (square, LinkedIn/Facebook/X landscape, comparison, pricing,
 * alternatives, research) is really the same dark-brand layout with a
 * different size and a different "kind" label. Visual language is pulled
 * directly from components/SocialImageContent.tsx (the real source of
 * truth already used for app/opengraph-image.tsx and app/twitter-image.tsx):
 * dark/charcoal background, bold white wordmark-style headline, muted
 * zinc-400 secondary text, no icon mark, no vendor logos (Phase 6:
 * "must not imply endorsement by third-party software brands").
 *
 * Usage: /api/social/card?size=square|linkedin|facebook|x&kind=comparison
 *   &headline=...&sub=...&badge=...
 * All text comes from the caller (the content engine, drafting from real
 * Miloosh data) — this route never fabricates copy itself.
 */

const SIZES: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  facebook: { width: 1200, height: 630 },
  x: { width: 1200, height: 675 },
};

const ACCENT = "#3b82f6"; // Minimal blue accent, per the brief's visual language — used sparingly (badge only).

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sizeKey = searchParams.get("size") ?? "square";
  const { width, height } = SIZES[sizeKey] ?? SIZES.square!;
  const headline = (searchParams.get("headline") ?? SITE_NAME).slice(0, 140);
  const sub = (searchParams.get("sub") ?? "").slice(0, 220);
  const badge = (searchParams.get("badge") ?? "").slice(0, 40);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: SITE_THEME_COLOR,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "white", letterSpacing: -1 }}>{SITE_NAME}</div>
          {badge ? (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 600,
                color: ACCENT,
                border: `2px solid ${ACCENT}`,
                borderRadius: 999,
                padding: "8px 20px",
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: sizeKey === "square" ? 56 : 48, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -1.5 }}>{headline}</div>
          {sub ? <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa", lineHeight: 1.4 }}>{sub}</div> : null}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>Software research you can verify.</div>
      </div>
    ),
    { width, height }
  );
}
