import { ImageResponse } from "next/og";
import { getAllCategories, getCategory } from "@/data/categories";
import { getSoftwareByCategory } from "@/lib/related";
import { SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";

/**
 * 2026-08-18 — see app/compare/[comparison]/opengraph-image.tsx's header
 * for the "why". Category-insight variant: real category name, real
 * product count, and up to 4 real product names actually in that
 * category — never a generic placeholder list.
 */

export const alt = "Software category";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

const ACCENT = "#3b82f6";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  const software = category ? getSoftwareByCategory(category.slug) : [];
  const names = software.slice(0, 4).map((s) => s.name);

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
            CATEGORY
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, color: "white", lineHeight: 1.05, letterSpacing: -2 }}>{category?.name ?? "Software"}</div>
          {software.length > 0 ? (
            <div style={{ display: "flex", fontSize: 26, color: "#a1a1aa" }}>{software.length} tools compared, including {names.join(", ")}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "#71717a" }}>Software research you can verify.</div>
      </div>
    ),
    { ...size }
  );
}
