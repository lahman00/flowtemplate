import { LAYERS_ICON_PATHS } from "@/lib/brand";
import { SITE_NAME, SITE_TAGLINE, SITE_THEME_COLOR } from "@/lib/site";

/**
 * Shared JSX for opengraph-image.tsx and twitter-image.tsx — both images
 * are visually identical placeholders, so the content lives in one place.
 * Not a normal page component: rendered only inside next/og's
 * ImageResponse, which supports a constrained subset of flex/CSS.
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
          width: 120,
          height: 120,
          borderRadius: 28,
          background: "white",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="72"
          height="72"
          viewBox="0 0 24 24"
          fill="none"
          stroke={SITE_THEME_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {LAYERS_ICON_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 40,
          fontSize: 72,
          fontWeight: 700,
          color: "white",
          letterSpacing: -2,
        }}
      >
        {SITE_NAME}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 16,
          fontSize: 32,
          color: "#a1a1aa",
        }}
      >
        {SITE_TAGLINE}
      </div>
    </div>
  );
}
