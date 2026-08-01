import { SITE_NAME, SITE_TAGLINE, SITE_THEME_COLOR } from "@/lib/site";

/**
 * Shared JSX for opengraph-image.tsx and twitter-image.tsx — both images
 * are visually identical placeholders, so the content lives in one place.
 * Not a normal page component: rendered only inside next/og's
 * ImageResponse, which supports a constrained subset of flex/CSS.
 *
 * Typography-first: the wordmark alone, no icon or symbol — consistent
 * with the wordmark-only logo used everywhere else in the brand.
 */
export function SocialImageContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: SITE_THEME_COLOR,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 88,
          fontWeight: 800,
          color: "white",
          letterSpacing: -3,
        }}
      >
        {SITE_NAME}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 20,
          fontSize: 32,
          color: "#a1a1aa",
        }}
      >
        {SITE_TAGLINE}
      </div>
    </div>
  );
}
