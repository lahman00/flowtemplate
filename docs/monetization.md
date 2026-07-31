# Monetization-ready architecture — no live monetization

Sprint 4 Phase 5 asked for the architecture behind affiliate buttons,
sponsored listings, featured software, and recommended software. Sprint 6
Phase 4 built it out properly into a dedicated affiliate module, and Phase
5 added reusable vendor-link blocks. Nothing described here is active on
any of the 30 entries today.

## Schema fields (`data/software/schema.ts`)

- `affiliate_url` (optional URL) — if a real affiliate relationship ever
  exists for an entry, this is where the link goes.
- `sponsored` (optional boolean) — marks a paid/sponsored listing.
- `featured` (optional boolean) — marks an editorially or commercially
  promoted listing.
- `links` (optional object) — `pricing`, `docs`, `support`, `integrations`,
  `status`, `community`, each an optional URL (Sprint 6 Phase 5). The
  official website already has its own required `website` field and its
  own CTA button; `links` only covers these six additional vendor pages.

None of the 30 JSON files set any of these fields.

## `lib/affiliate.ts` — the affiliate-link engine

- `preferredUrl(link)` — returns `affiliateUrl` if set, otherwise the plain
  `officialUrl`. Never returns an empty string.
- `getSoftwareCtaUrl(software)` — the actual function every "Visit official
  site" button calls. Applies `preferredUrl`, then — only when the result
  is genuinely an affiliate link — appends any configured tracking
  parameter (see below). Currently always resolves to the plain official
  link, since no entry sets `affiliate_url`.
- `getSoftwareCtaRel(software)` — returns
  `rel="sponsored noopener noreferrer"` only when an affiliate URL is
  actually configured, otherwise `rel="noopener noreferrer"`. Follows
  Google's own guidance for marking paid/affiliate links.
- `withTrackingParams(url, params)` / `getConfiguredTrackingParams()` — a
  tracking parameter (e.g. an affiliate network's ref code) can be set via
  `NEXT_PUBLIC_AFFILIATE_REF` (see `.env.example`) and is applied only to
  genuine affiliate links, never to official links. Unset today, so this is
  a no-op.
- `shouldShowAffiliateDisclosure(software)` — true only when the entry has
  a real `affiliateUrl`. Drives the inline "This is an affiliate link" note
  under the CTA button on `app/software/[slug]/page.tsx` — never shown
  today.

## `lib/monetization.ts` — sponsored/featured/recommended

- `isSponsored`, `isFeatured` — boolean checks on the two flags.
- `getFeaturedSoftware(limit)` — filters for `featured === true`. Returns
  `[]` today.
- `getRecommendedSoftware(limit)` — prefers explicitly featured entries;
  falls back to `getPopularAlternatives` (the same real, computed
  "most often listed as an alternative" metric `lib/related.ts` uses for
  "popular"). Never needs fabricated ratings to return a real list.

## `components/ListingBadges.tsx`

Renders "Sponsored" / "Featured" pills — but returns `null` and renders
nothing unless `sponsored` or `featured` is actually `true` on that entry.
Wired into `app/software/[slug]/page.tsx`'s header; never visible today.

## `components/VendorLinksBlock.tsx`

Renders a small "More from {name}" list of whichever of the six `links`
fields are actually set, each with `target="_blank" rel="noopener noreferrer"`.
Returns `null` when none are set — which is every entry today. Wired into
the same card as the official-site CTA on the software page.

## Turning any of this on for real

1. Get a real affiliate relationship, sponsorship agreement, or a real
   pricing/docs/support/etc. URL for a specific tool.
2. Set the corresponding field(s) on that entry's JSON file
   (`affiliate_url`, `sponsored: true`, `featured: true`, or `links.*`).
3. `npm run validate:data` — every URL is validated as a real URL by the
   existing schema, same as `website`.

No component or page code needs to change — the badges, CTA link,
disclosure note, and vendor links block all switch on automatically for
that one entry.
