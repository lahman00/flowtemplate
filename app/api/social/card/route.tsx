import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";
import { loadInterFonts } from "@/lib/social/fonts";

// 2026-08-18 brand forensics: moved off edge runtime (fonts.ts needs Node's
// fs to load the real Inter TTFs — see that file's header). Node/Fluid
// Compute is also current Vercel guidance over edge for routes like this.

/**
 * Phase 6 visual engine — one reusable, parameterized card generator
 * instead of eight near-duplicate static templates, since every required
 * card type (square, LinkedIn/Facebook/X landscape, comparison, pricing,
 * alternatives, research, category, switching) shares the same dark-brand
 * token system (background, wordmark, accent, tagline) but composes it
 * differently per kind. Visual language is pulled directly from
 * components/SocialImageContent.tsx (the real source of truth already
 * used for app/opengraph-image.tsx and app/twitter-image.tsx): dark/
 * charcoal background, bold white wordmark-style headline, muted
 * zinc-400 secondary text, no icon mark, no vendor logos (Phase 6:
 * "must not imply endorsement by third-party software brands").
 *
 * Usage: /api/social/card?size=square|linkedin|facebook|x&kind=comparison
 *   &headline=...&sub=...&badge=...
 * All text comes from the caller (the content engine, drafting from real
 * Miloosh data) — this route never fabricates copy itself.
 *
 * 2026-08-18 — LinkedIn Company Page audit found every kind rendering the
 * literal same stacked-headline layout, differing only by a two-word
 * badge ("the same black Miloosh card" for every post, not just link
 * previews). Fixed by giving comparison/switching/pricing/alternatives/
 * category each a real, distinct composition — parsed out of the same
 * headline/sub strings the content engine already sends (content-engine.ts's
 * exact phrasing for each pillar: "{A} vs {B}: ...", "Moving from {A} to
 * {B}? ...", "{N} {Category} tools, ..."), never new params or invented
 * facts. When a kind's expected pattern isn't present in the text, it
 * falls back to the original stacked layout rather than showing nothing.
 */

const SIZES: Record<string, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  linkedin: { width: 1200, height: 627 },
  facebook: { width: 1200, height: 630 },
  x: { width: 1200, height: 675 },
};

const KIND_LABELS: Record<string, string> = {
  pricing: "PRICING UPDATE",
  comparison: "COMPARISON",
  alternatives: "ALTERNATIVES",
  research: "VERIFIED RESEARCH",
  category: "CATEGORY INSIGHT",
  switching: "SWITCHING GUIDE",
};

// Matches app/globals.css's --color-accent — the site's real accent token, not an arbitrary blue.
const ACCENT = "#3458a8";

function Header({ badge }: { badge: string }) {
  return (
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
  );
}

function Footer() {
  return <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>Software research you can verify.</div>;
}

function StackedBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", fontSize: sizeKey === "square" ? 56 : 48, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -1.5 }}>{headline}</div>
      {sub ? <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa", lineHeight: 1.4 }}>{sub}</div> : null}
    </div>
  );
}

// "{A} vs {B}: ..." -> split-panel with a VS badge, mirroring app/compare/[comparison]/opengraph-image.tsx.
function ComparisonBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  const match = headline.match(/^(.+?)\s+vs\.?\s+(.+?):/i);
  if (!match) return <StackedBody headline={headline} sub={sub} sizeKey={sizeKey} />;
  const [, nameA, nameB] = match;
  const nameSize = sizeKey === "square" ? 52 : 44;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <div style={{ display: "flex", flex: 1, fontSize: nameSize, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: -1, justifyContent: "flex-end", textAlign: "right" }}>{nameA}</div>
        <div
          style={{
            display: "flex",
            width: 64,
            height: 64,
            borderRadius: 999,
            border: `3px solid ${ACCENT}`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", fontSize: 20, fontWeight: 800, color: ACCENT }}>VS</div>
        </div>
        <div style={{ display: "flex", flex: 1, fontSize: nameSize, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: -1 }}>{nameB}</div>
      </div>
      {sub ? <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa", lineHeight: 1.4, textAlign: "center", justifyContent: "center" }}>{sub}</div> : null}
    </div>
  );
}

// "Moving from {A} to {B}? ..." -> A -> B arrow layout, distinct from a straight VS comparison.
function SwitchingBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  const match = headline.match(/from\s+(.+?)\s+to\s+([^?.,]+)/i);
  if (!match) return <StackedBody headline={headline} sub={sub} sizeKey={sizeKey} />;
  const [, nameA, nameB] = match;
  const nameSize = sizeKey === "square" ? 46 : 40;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            display: "flex",
            fontSize: nameSize,
            fontWeight: 700,
            color: "#a1a1aa",
            lineHeight: 1.1,
          }}
        >
          {nameA}
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: ACCENT }}>{"→"}</div>
        <div style={{ display: "flex", fontSize: nameSize, fontWeight: 800, color: "white", lineHeight: 1.1, letterSpacing: -1 }}>{nameB}</div>
      </div>
      {sub ? <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa", lineHeight: 1.4, maxWidth: 900 }}>{sub}</div> : null}
    </div>
  );
}

// Headline/sub containing a real "$..." figure -> the price pulled out into its own accent chip, mirroring app/software/[slug]/opengraph-image.tsx.
function PricingBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  const priceMatch = `${headline} ${sub}`.match(/\$[\d][\d,.]*(?:\/\w+)?/);
  if (!priceMatch) return <StackedBody headline={headline} sub={sub} sizeKey={sizeKey} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", fontSize: sizeKey === "square" ? 44 : 38, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -1 }}>{headline}</div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            color: SITE_THEME_COLOR,
            background: ACCENT,
            borderRadius: 10,
            padding: "14px 28px",
          }}
        >
          {priceMatch[0]}
        </div>
      </div>
      {sub ? <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa", lineHeight: 1.4 }}>{sub}</div> : null}
    </div>
  );
}

// sub is a "; "-joined pick list -> numbered rows, distinct from a single stacked block.
function AlternativesBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  const picks = sub
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (picks.length < 2) return <StackedBody headline={headline} sub={sub} sizeKey={sizeKey} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", fontSize: sizeKey === "square" ? 46 : 40, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -1.5 }}>{headline}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {picks.map((pick, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `2px solid ${ACCENT}`,
                color: ACCENT,
                fontSize: 18,
                fontWeight: 800,
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ display: "flex", fontSize: 24, color: "#e4e4e7", lineHeight: 1.3 }}>{pick}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// "{N} {Category} tools, ..." -> the count pulled into a large stat, mirroring app/category/[slug]/opengraph-image.tsx.
function CategoryBody({ headline, sub, sizeKey }: { headline: string; sub: string; sizeKey: string }) {
  const match = headline.match(/^(\d+)\s+(.+?)\s+tools/i);
  if (!match) return <StackedBody headline={headline} sub={sub} sizeKey={sizeKey} />;
  const [, count, categoryName] = match;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{count}</div>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 600, color: "#71717a", letterSpacing: 1 }}>TOOLS</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", fontSize: sizeKey === "square" ? 44 : 38, fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: -1 }}>{categoryName}</div>
        {sub ? <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa", lineHeight: 1.4, maxWidth: 700 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

const BODY_BY_KIND: Record<string, typeof StackedBody> = {
  comparison: ComparisonBody,
  switching: SwitchingBody,
  pricing: PricingBody,
  alternatives: AlternativesBody,
  category: CategoryBody,
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sizeKey = searchParams.get("size") ?? "square";
  const kind = searchParams.get("kind") ?? "";
  const { width, height } = SIZES[sizeKey] ?? SIZES.square!;
  const headline = (searchParams.get("headline") ?? SITE_NAME).slice(0, 140);
  const sub = (searchParams.get("sub") ?? "").slice(0, 220);
  const badge = (searchParams.get("badge") ?? KIND_LABELS[kind] ?? "").slice(0, 40);
  const Body = BODY_BY_KIND[kind] ?? StackedBody;

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
        <Header badge={badge} />
        <Body headline={headline} sub={sub} sizeKey={sizeKey} />
        <Footer />
      </div>
    ),
    { width, height, fonts: await loadInterFonts() }
  );
}
