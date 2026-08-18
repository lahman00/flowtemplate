import { ImageResponse } from "next/og";
import { getAllSoftware, getSoftware } from "@/data/software";
import { getCategoryName } from "@/data/categories";
import { SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";

/**
 * 2026-08-18 — see app/compare/[comparison]/opengraph-image.tsx's header
 * for the "why": every page previously shared one static root image. This
 * is the /software profile variant — shows the real product name,
 * category, and (only when Miloosh actually has sourced pricing data,
 * never fabricated) its real starting price, so this one template
 * naturally serves both the "pricing" and "alternatives" post types the
 * LinkedIn visual-system request asked for, since both point at the same
 * software page.
 */

export const alt = "Software profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllSoftware().map((software) => ({ slug: software.slug }));
}

const ACCENT = "#3b82f6";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const software = getSoftware(slug);

  const name = software?.name ?? SITE_NAME;
  const categoryName = software ? getCategoryName(software.category) : "";
  const bestFor = software?.bestFor ?? "";
  const price = software?.pricing?.startingPrice;
  const priceModel = software?.pricing?.model;
  const priceLabel = price ? `From ${price}` : priceModel === "free" ? "Free" : priceModel === "open_source" ? "Open source" : null;

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
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "white", letterSpacing: -0.5 }}>{SITE_NAME}</div>
          {categoryName ? (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 600,
                color: ACCENT,
                border: `2px solid ${ACCENT}`,
                borderRadius: 999,
                padding: "6px 16px",
              }}
            >
              {categoryName.toUpperCase()}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, color: "white", lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
          {bestFor ? (
            <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa", lineHeight: 1.4, maxWidth: 900 }}>{bestFor.length > 160 ? `${bestFor.slice(0, 157)}...` : bestFor}</div>
          ) : null}
          {priceLabel ? (
            <div style={{ display: "flex", marginTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                  color: SITE_THEME_COLOR,
                  background: ACCENT,
                  borderRadius: 8,
                  padding: "10px 20px",
                }}
              >
                {priceLabel}
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>Software research you can verify.</div>
      </div>
    ),
    { ...size }
  );
}
