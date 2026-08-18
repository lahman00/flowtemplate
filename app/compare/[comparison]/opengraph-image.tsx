import { ImageResponse } from "next/og";
import { getComparisonBySlug } from "@/lib/comparison";
import { getPublishedComparisonSlugs } from "@/data/comparisons";
import { SITE_NAME, SITE_THEME_COLOR } from "@/lib/site";

/**
 * 2026-08-18 — LinkedIn Company Page visual audit found every Miloosh
 * link (software, compare, category — all of them) sharing the single
 * static root app/opengraph-image.tsx, so every link preview on every
 * channel looked identical ("the same black Miloosh card"). This is the
 * fix for the /compare route specifically: a real "X vs Y" split layout
 * driven by the actual two products being compared, not a generic
 * placeholder. Deliberately NOT edge runtime — getComparisonBySlug reads
 * the software/comparison data via fs, same as the page itself, so this
 * needs the Node runtime the page already implicitly uses.
 */

export const alt = "Software comparison";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getPublishedComparisonSlugs().map((comparison) => ({ comparison }));
}

const ACCENT = "#3b82f6";

export default async function Image({ params }: { params: Promise<{ comparison: string }> }) {
  const { comparison } = await params;
  const data = getComparisonBySlug(comparison);

  const nameA = data?.softwareA.name ?? "Option A";
  const nameB = data?.softwareB.name ?? "Option B";
  const catA = data ? data.softwareA.category : "";
  const catB = data ? data.softwareB.category : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: SITE_THEME_COLOR,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "40px 56px 0" }}>
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
            COMPARISON
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", padding: "0 56px" }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "flex-end", textAlign: "right", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.05, letterSpacing: -1.5 }}>{nameA}</div>
            {catA ? <div style={{ display: "flex", fontSize: 22, color: "#a1a1aa" }}>{catA}</div> : null}
          </div>

          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              borderRadius: 999,
              border: `3px solid ${ACCENT}`,
              alignItems: "center",
              justifyContent: "center",
              margin: "0 40px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: ACCENT }}>VS</div>
          </div>

          <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: 8 }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.05, letterSpacing: -1.5 }}>{nameB}</div>
            {catB ? <div style={{ display: "flex", fontSize: 22, color: "#a1a1aa" }}>{catB}</div> : null}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "0 56px 40px" }}>
          <div style={{ display: "flex", fontSize: 20, color: "#71717a" }}>Software research you can verify.</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
