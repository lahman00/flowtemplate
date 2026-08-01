import packageJson from "../package.json";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const SITE_NAME = "Miloosh";

export const SITE_TAGLINE = "Software research you can verify.";

export const SITE_DESCRIPTION =
  "Compare software alternatives, pricing, features, and migration options — every claim sourced and dated, so you can switch with confidence.";

export const SITE_EMAIL = "hello@miloosh.app";

/** Matches the viewport theme-color in app/layout.tsx and the generated icons/OG images — one place to change the brand color. */
export const SITE_THEME_COLOR = "#09090b";

/** Sourced from package.json so it never drifts from the actual shipped version. */
export const SITE_VERSION = packageJson.version;
