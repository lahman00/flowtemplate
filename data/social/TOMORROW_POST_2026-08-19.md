# Tomorrow's Post — 2026-08-19

Not published. Prepared and QA'd, ready for Eyal to post manually (LinkedIn has no working publish API for Miloosh yet — see Phase 7 findings). Facebook's real auto-publish queue is separate and unaffected; this is an *additional*, hand-picked piece for both channels.

## Why this topic

- Doesn't repeat either of the 2 existing posts (both are "why Miloosh exists" positioning; this is the first real product-comparison post).
- Miro is the affiliate pipeline's most-advanced product (`approved` stage) — a soft tiebreaker only, not the reason it was picked (see `AFFILIATE_EDITORIAL_MATRIX.md`).
- The comparison page (`/compare/miro-vs-lucidchart`) is already published and has real, sourced feature data for both products — no research gap to fill.
- Genuine differentiation exists and is checkable: Miro's product page literally centers "Intelligent Canvas infinite multiplayer workspace"; Lucidchart's centers "Lucid AI generates diagrams from text prompts" + "Data linking to Google Sheets, Excel, or CSV files." These aren't spun — they're each company's own stated core feature.

## LinkedIn post (LinkedIn-native, not an SEO intro)

> Miro and Lucidchart both get called "visual collaboration tools." They're not solving the same problem.
>
> Miro is built around an open, infinite canvas — teams use it for early-stage thinking, workshops, and product work that doesn't have a fixed shape yet.
>
> Lucidchart is built around structured diagrams — flowcharts, org charts, system architecture — with data linking to sheets and spreadsheets, so the diagram can reflect live information instead of a static snapshot.
>
> If your work starts messy and gets structured later, that points one way. If you already know the shape of what you're documenting, that points the other.
>
> We compared the real feature sets side by side, sourced directly from both companies: [link]

- **No emoji, no hashtags, no "Did you know?", no fake question.** Ends with a real reason to click, not engagement bait.
- **Destination:** `https://miloosh.com/compare/miro-vs-lucidchart?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=miro-vs-lucidchart-2026-08-19`
- **Visual:** `https://miloosh.com/api/social/card?size=linkedin&kind=comparison&headline=Miro%20vs%20Lucidchart%3A%20what%20actually%20differs%3F&sub=Miro%3A%20open%2C%20infinite%20canvas%20for%20early-stage%20thinking.%20Lucidchart%3A%20structured%2C%20data-linked%20diagrams%20for%20documenting%20systems.` — real Inter font, correct navy accent, split-panel comparison template. Fetched and visually confirmed (200, renders correctly) as of this pass.

## Facebook post — distinct angle, not a duplicate

> "Which is better, Miro or Lucidchart?" is the wrong question — they're built for different moments.
>
> Miro: you don't know the shape of the problem yet. Open canvas, workshop-style, figure it out as a team.
> Lucidchart: you already know the shape. Structured diagrams, data-linked to your actual spreadsheets, built to stay accurate over time.
>
> We broke down the real feature differences (not just the marketing pages) here: [link]
>
> Which one matches how your team actually works?

- Facebook's own adapter (`lib/social/channels/facebook.ts`) still applies its own formatting/truncation at publish time — this text fits comfortably under its char limit.
- Conversational close (a real question about the reader's own workflow) matches the two existing Facebook posts' style, not LinkedIn's more declarative tone — genuinely different copy, not a reformat.
- **Destination:** `https://miloosh.com/compare/miro-vs-lucidchart?utm_source=facebook&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=miro-vs-lucidchart-2026-08-19-fb`
- **Visual:** same card route, `size=facebook` instead of `size=linkedin`.

## QA checklist (all verified this pass)

- [x] Logo — not present on this card (correct; the card shows the "Miloosh" wordmark, not the icon mark, matching the brand standard's card template).
- [x] Typography — real Inter, confirmed via direct screenshot of the fetched card.
- [x] Spelling — "Miro" / "Lucidchart" both correct; copy proofread.
- [x] Product names — match the real `data/software/miro.json` / `lucidchart.json` `name` fields exactly.
- [x] No prices mentioned — correctly, since neither JSON file has sourced pricing data. Nothing was invented to fill the gap.
- [x] Crop — card fetched at both `size=linkedin` (1200×627) and will render correctly at `size=facebook` (1200×630); same template already visually verified in this session.
- [x] Source data — every factual claim traces to `data/software/miro.json` / `lucidchart.json`'s real `description`/`features` fields, both sourced 2026-07-31.
- [x] Destination URL — `https://miloosh.com/compare/miro-vs-lucidchart` returns HTTP 200 (checked live).
- [x] UTM — present and channel-distinct on both links, following the existing `buildUtmUrl` convention (`utm_source`/`utm_medium`/`utm_campaign`/`utm_content`).
- [x] Affiliate disclosure — not applicable; Miro has no active affiliate link in production (see `AFFILIATE_EDITORIAL_MATRIX.md`), so `shouldShowAffiliateDisclosure()` correctly returns false and no disclosure is owed.
