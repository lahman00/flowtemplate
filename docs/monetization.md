# Monetization-ready architecture — no live monetization

Sprint 4 Phase 5 asked for the architecture behind affiliate buttons,
sponsored listings, featured software, and recommended software, with an
explicit "no fake links, only architecture" constraint. Nothing described
here is active on any of the 30 entries today.

## Schema fields (`data/software/schema.ts`)

- `affiliate_url` (optional URL) — if a real affiliate relationship ever
  exists for an entry, this is where the link goes.
- `sponsored` (optional boolean) — marks a paid/sponsored listing.
- `featured` (optional boolean) — marks an editorially or commercially
  promoted listing.

None of the 30 JSON files set any of these three fields.

## `lib/monetization.ts`

- `getSoftwareCtaUrl(software)` — returns `affiliateUrl` if set, otherwise
  the plain `website`. Every "Visit official site" button on every
  software page goes through this function today, so it's already live
  code, just currently always resolving to the honest plain link.
- `getSoftwareCtaRel(software)` — returns `rel="sponsored noopener noreferrer"`
  only when an affiliate URL is actually configured, otherwise
  `rel="noopener noreferrer"`. This follows Google's own guidance for
  marking paid/affiliate links — it's correct today because it never
  claims "sponsored" on a link that isn't.
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
Already wired into `app/software/[slug]/page.tsx`'s header; it's simply
never visible today because no entry sets either flag.

## Turning any of this on for real

1. Get a real affiliate relationship or sponsorship agreement for a
   specific tool.
2. Set `affiliate_url` and/or `sponsored: true` (or `featured: true` for a
   promoted placement) on that entry's JSON file.
3. `npm run validate:data` — the URL is validated as a real URL by the
   existing schema, same as `website`.

No component or page code needs to change — the badges and CTA link will
switch on automatically for that one entry.
