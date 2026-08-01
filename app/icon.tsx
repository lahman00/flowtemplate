import { ImageResponse } from "next/og";
import { SITE_THEME_COLOR } from "@/lib/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Typography-first favicon: the wordmark's own first letter, not a
 * separate icon or symbol — consistent with the wordmark-only logo used
 * everywhere else in the brand.
 */
export default function Icon() {
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
            letterSpacing: -0.5,
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  );
}
