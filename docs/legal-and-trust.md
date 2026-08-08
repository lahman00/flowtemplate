# Legal & trust architecture

Sprint 5 added the legal and trust pages needed for a public commercial
launch. The governing rule throughout: describe the site as it actually
operates, never as it might operate someday or as a template might imply.

## Pages (`lib/legal.ts` → `LEGAL_PAGES`)

One shared list drives both the footer's "Legal & trust" column and the
sitemap — a new legal page is added to the site by adding one entry there,
not by hand-editing both places separately.

| Page | Route | What it actually says |
|---|---|---|
| Privacy Policy | `/privacy` | No accounts, no database, no cookies set until you consent to analytics. |
| Terms of Service | `/terms` | General informational use; not professional advice. |
| Disclaimer | `/disclaimer` | Verify pricing/features with the vendor; not legal/financial/security/procurement advice; user is responsible for their own decision. |
| Affiliate Disclosure | `/affiliate-disclosure` | No link on the site is currently an affiliate link — stated as present-tense fact, not a hedge. Explains how a real affiliate link would be marked if one is ever added. |
| Editorial Policy | `/editorial-policy` | Official sources preferred, data is schema-validated, no fabricated ratings, commercial relationships don't affect placement. |
| Sources Policy | `/sources-policy` | Official product pages are primary; pricing is deliberately not tracked; unverifiable fields are left blank; access dates are stored (see below). |
| Corrections Policy | `/corrections-policy` | How to report an error, what to include, no guaranteed timeline, corrections are free. |
| AI Usage Disclosure | `/ai-usage` | States plainly that AI/automation assists with drafting and validation, and does **not** claim every fact has been manually re-verified by a human. |
| Accessibility Statement | `/accessibility` | States goals and current practices; explicitly does not claim WCAG conformance/certification. |
| Cookie Policy | `/cookies` | States plainly that no cookies are set for advertising or auth, ever, and none for analytics until you explicitly consent via the banner (Google Consent Mode v2, default denied) — see "GA4 consent mode" below. |
| Trademark Notice | `/trademark-notice` | Product/company names belong to their owners; listing ≠ endorsement. |

Every page uses the shared `components/LegalPageLayout.tsx` (breadcrumbs,
`BreadcrumbList` JSON-LD, an H1, a "Last updated" date from
`lib/legal.ts`'s `LEGAL_LAST_UPDATED`, and `components/LegalContent.tsx`
sections) and has its own `metadata` export with a canonical URL.

## What was verified before writing the Cookie Policy

Before claiming "no cookies," the codebase was actually inspected rather
than assumed:

- Grepped for cookie/analytics/tracking code (`gtag`, `fbq`, `analytics`,
  etc.) across `app/`, `components/`, `lib/`, `data/` — none found outside
  the Privacy/Cookie policy text itself.
- `@supabase/ssr`, `@supabase/supabase-js`, and `@prisma/client` were
  installed as dependencies but never imported anywhere in the app; a
  Sprint 11 launch audit confirmed they were still unused and removed them
  entirely, so there's no longer even a dormant cookie-based session
  mechanism sitting in the dependency tree.
- Confirmed there is no `middleware.ts`, and the only `<form>` on the site
  (`SearchForm`) does a client-side redirect and never sends a network
  request. Two API routes were added later (`app/api/outbound-click/route.ts`,
  Sprint 9; `app/api/recommendation-click/route.ts`, Sprint 10) — both
  read/write a local, first-party JSON log server-side and return a plain
  JSON response; neither sets a cookie, reads a cookie, or touches
  `Set-Cookie` in any way. Re-verified as part of the same Sprint 11 audit.

Because of this, no cookie consent banner was added at that time — the
task was explicit that one should only be added if actually required, and
at that point it wasn't.

## GA4 consent mode (later addition)

Once Google Analytics was actually turned on for production, a consent
banner became required and was added: `lib/consent.ts`,
`components/GoogleAnalyticsConsent.tsx`, `components/ConsentBanner.tsx`,
and `components/CookiePreferencesControl.tsx`. Google Consent Mode v2
defaults every signal (`analytics_storage` included) to `denied` before
anything else analytics-related runs; the real `gtag.js` script — the
only piece that can set a cookie or contact Google — is only rendered
into the tree (and only then does it load) after the visitor clicks
"Allow analytics." The choice is stored in `localStorage`, not a cookie,
and can be changed anytime on `/cookies`.

## `accessed_at` — making the Sources Policy true, not aspirational

The Sources Policy states "access dates are stored." Before Sprint 5, that
wasn't actually true — no such field existed. Rather than write a policy
page describing a capability the site didn't have, `data/software/schema.ts`
gained a required `accessed_at` field (`YYYY-MM-DD`), populated on all 30
existing entries with the date their sources were originally fetched during
Sprint 4's research. `app/software/[slug]/page.tsx` now has a visible
"Sources" section listing every cited URL with the access date shown in
plain language, each link using `target="_blank" rel="noopener noreferrer"`.

## Footer

Reorganized into columns (`components/Footer.tsx`): Product, Company, and
"Legal & trust" (all 11 pages from `LEGAL_PAGES`), plus the existing
dynamic-year copyright line, so the 11 legal links don't clutter a single
flat row.

## Adding a new legal page later

1. Create `app/<slug>/page.tsx` using `LegalPageLayout` (see any existing
   page in `app/` for the pattern — `metadata` export with `canonical`,
   `title`/`path`/`sections` props).
2. Add `{ name, href }` to `LEGAL_PAGES` in `lib/legal.ts`.

The footer and sitemap pick it up automatically — no other file needs to
change.
