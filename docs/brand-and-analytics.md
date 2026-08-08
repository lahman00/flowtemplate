# Brand centralization, visual identity, and analytics

## Brand constants (`lib/site.ts`)

Every brand-identifying string in the app is centralized here — nothing
else in the codebase hardcodes the site name, email, URL, tagline, theme
color, or version:

| Constant | Source | Used for |
|---|---|---|
| `SITE_NAME` | hardcoded string | wordmark, page titles, all "on {SITE_NAME}" copy |
| `SITE_TAGLINE` | hardcoded string | footer, OG/Twitter image, manifest |
| `SITE_DESCRIPTION` | hardcoded string | meta description, manifest |
| `SITE_EMAIL` | hardcoded string | every "contact us" mention (renamed from `CONTACT_EMAIL` for naming consistency) |
| `SITE_URL` | `NEXT_PUBLIC_SITE_URL` env var, falls back to `http://localhost:3000` | canonical URLs, JSON-LD, sitemap, `metadataBase` |
| `SITE_THEME_COLOR` | hardcoded hex | `viewport.themeColor`, manifest, generated icons/OG images |
| `SITE_VERSION` | `package.json`'s `version` field | Footer, About page — can never drift from the actual shipped version |

**Renaming the whole site** means changing `SITE_NAME` (and `SITE_EMAIL`,
`SITE_URL` if applicable) in this one file — every page, every piece of
metadata, and the generated icons/OG images pick it up automatically. This
was verified by grepping the entire `app/`, `components/`, `lib/`, `data/`
tree for the literal string `"Miloosh"` after the Sprint 6 Phase 1
pass — the only remaining match is `lib/site.ts`'s own definition.

Also removed as part of "replace every remaining placeholder": the 5
unused default `create-next-app` SVGs in `public/` (`file.svg`,
`globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — never referenced
anywhere) and the generic default `favicon.ico`, both dead weight from the
original scaffold.

## Visual identity (`app/icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`, `manifest.ts`)

All generated at build time via `next/og`'s `ImageResponse`, not static
files — so they always match the current `SITE_NAME`/`SITE_THEME_COLOR`
with zero hand-editing. All four reuse the exact same logomark: lucide's
"Layers" icon path data (`lib/brand.ts`), the same one used in
`Navbar`/`Footer` — so the favicon, app icon, and OG image are visually
identical to the in-app wordmark, not a separately-drawn approximation.

`opengraph-image.tsx` and `twitter-image.tsx` share their JSX via
`components/SocialImageContent.tsx` rather than duplicating it — Twitter
image is a straightforward reuse of the OG image content, not a separate
design (both 1200×630, dark background, logomark, `SITE_NAME`, `SITE_TAGLINE`).

`app/manifest.ts` generates `manifest.webmanifest` from the same
`SITE_NAME`/`SITE_DESCRIPTION`/`SITE_THEME_COLOR` constants and references
the generated `/icon` and `/apple-icon` routes.

Verified in-browser: fetched `/icon`, `/apple-icon`, and `/opengraph-image`
directly and visually confirmed the logomark renders correctly (not just
that the build didn't error), and confirmed Next.js auto-injects the
correct `<link rel="icon">`, `<meta property="og:image">`, and
`<meta name="twitter:image">` tags with no manual metadata needed.

## Analytics (`lib/analytics.ts`, `components/Analytics.tsx`)

Off by default, and only turns on via environment variables — never
hardcoded, never on by default:

- `NEXT_PUBLIC_ANALYTICS_PROVIDER` — `"ga"`, `"plausible"`, `"posthog"`, or
  unset/anything else (treated as `"none"`).
- Each provider also needs its own required variable
  (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`,
  `NEXT_PUBLIC_POSTHOG_KEY`) — if that's missing, `getAnalyticsConfig()`
  falls back to `"none"` regardless of what the provider variable says. See
  `.env.example` for the full list.

`<Analytics />` is rendered unconditionally in `app/layout.tsx`, but
resolves to `null` whenever the provider is `"none"`. PostHog uses the
official `posthog-js` package (`posthog.init()`) rather than a
hand-reconstructed inline snippet, so its exact behavior matches
PostHog's own documented API instead of a best-effort copy from memory.

**Production now runs `provider: "ga"`** (GA4, `G-BBFL3YH9NZ`), gated
behind Google Consent Mode v2 rather than loading unconditionally — see
`components/GoogleAnalyticsConsent.tsx`. `getAnalyticsConfig()` itself is
unchanged; only the `"ga"` branch of `<Analytics />` changed, from
rendering the gtag.js scripts directly to delegating to
`GoogleAnalyticsConsent`, which:

1. Always sets every Consent Mode signal to `denied` by default the
   moment it mounts (a JS state declaration, no network call, no cookie).
2. Only renders (and only then loads) the real `gtag.js` script once the
   visitor has explicitly clicked "Allow analytics" in the banner it
   shows, or previously did so on an earlier visit (read from
   `localStorage` via `lib/consent.ts`).

Verified directly: fetched the homepage's rendered HTML pre-consent and
grepped for `googletagmanager.com`/`gtag(` — zero matches. With
`NEXT_PUBLIC_ANALYTICS_PROVIDER=ga`/`NEXT_PUBLIC_GA_MEASUREMENT_ID` set
locally and consent granted, confirmed exactly one `gtag.js` script tag
and one `gtag('config', ...)` call across the homepage, a software page,
a category page, and a comparison page — no duplication, applied
site-wide via the root layout as expected. See `docs/legal-and-trust.md`
("GA4 consent mode") and `/cookies` for the full policy detail.
