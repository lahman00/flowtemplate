import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";
import { loadInterFonts } from "@/lib/social/fonts";

/**
 * 2026-08-18 — LinkedIn Company Page banner, built once and uploaded
 * manually (not part of the automated OG/card pipeline — LinkedIn has no
 * upload API for this admins actually use here). 4200x700 is LinkedIn's
 * current documented upload size for company page cover images (verified
 * via search, not assumed); the live page renders it at ~1128x191, and
 * mobile shows a narrower horizontal slice with the page logo overlapping
 * the bottom-left ~30% width. Headline kept short, single line, centered
 * in the top half, well clear of both danger zones — see
 * MILOOSH_SOCIAL_BRAND_STANDARD.md for the full brand tokens this reuses.
 *
 * Temporary route — delete once the banner is uploaded and verified live.
 */

const WIDTH = 4200;
const HEIGHT = 700;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 130,
          background: SITE_THEME_COLOR,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 152,
            fontWeight: 800,
            color: "white",
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          Software research you can verify.
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts: await loadInterFonts() }
  );
}
