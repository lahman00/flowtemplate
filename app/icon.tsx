import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";
import { loadInterFonts } from "@/lib/social/fonts";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * 2026-08-18 brand forensics — replaces the static app/icon.png, which
 * was a different logomark (a two-tone angular "M" graphic) than every
 * other real brand surface: apple-icon.tsx's plain typographic "M" and
 * the actual live LinkedIn Company Page logo both use the plain mark.
 * Two independent real surfaces agreeing made icon.png the stale outlier,
 * not the other way round — see MILOOSH_SOCIAL_BRAND_STANDARD.md.
 */
export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SITE_THEME_COLOR,
          borderRadius: 7,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "white",
            letterSpacing: -1,
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size, fonts: await loadInterFonts() }
  );
}
