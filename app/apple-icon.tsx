import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Typography-first app icon: the wordmark's own first letter, not a
 * separate icon or symbol — consistent with the wordmark-only logo used
 * everywhere else in the brand.
 */
export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 108,
            fontWeight: 800,
            color: "white",
            letterSpacing: -2,
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
