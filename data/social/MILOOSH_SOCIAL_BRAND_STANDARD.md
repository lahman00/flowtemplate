# Miloosh Social Brand Standard

Canonical source of truth for every visual and typographic decision across Miloosh's site, OG images, and social cards. Written 2026-08-18 from a live forensic audit of the production site (miloosh.com), the authenticated LinkedIn Company Page, and every code path that generates a brand-facing image. Every claim below was verified against real code or a live screenshot — nothing here is aspirational.

## 1. Logo

**Canonical mark: the plain typographic "M"** — a single bold (weight 800) uppercase letterform, white on the brand background, in a rounded-square container. This is confirmed by **two independent live sources agreeing**: `app/apple-icon.tsx` (code-generated) and the logo actually uploaded to the live LinkedIn Company Page. Neither was copied from the other — they arrived at the same mark independently, which is the strongest evidence of "canonical" available.

**Finding — obsolete asset (fixed this session):** `app/icon.png` was a *different* logomark: a two-tone angular "M" chevron/crown graphic, hand-uploaded as a static file, never derived from site tokens. It was the outlier against the other two agreeing surfaces. Replaced with a code-generated `app/icon.tsx` using the exact same plain-M mark as `apple-icon.tsx`, at the correct 32×32 size the manifest already expected. The stale `icon.png` file was deleted.

**Do not use:** the old two-tone chevron graphic anywhere going forward. If a more elaborate graphic mark is ever wanted, that's a real design decision to make deliberately — not to let survive by accident in one unaudited file.

## 2. Typography

**Typeface: Inter** (Google Fonts), the same face the live product uses via `next/font/google` in `app/layout.tsx`.

**Finding — fallback font (fixed this session):** every `ImageResponse` call in the app (root OG/Twitter image, apple-icon, the three per-route OG images, the `/api/social/card` generator used for every LinkedIn/Facebook/X post image) passed no `fonts` option. Satori (next/og's renderer) does not inherit `next/font` automatically — it silently falls back to its own bundled default, which is **not** Inter. Every social-facing image on Miloosh, ever generated, rendered in the wrong typeface until this fix.

Fixed by downloading the real Inter TTF weights directly from Google Fonts' own CDN (`assets/fonts/Inter-{Regular,SemiBold,Bold,ExtraBold}.ttf` — 400/600/700/800) and loading them through one shared helper, `lib/social/fonts.ts`, which every `ImageResponse` call now passes via `fonts: await loadInterFonts()`. This required moving `/api/social/card` off `runtime = "edge"` (edge has no `fs`) onto the default Node/Fluid Compute runtime — also current Vercel guidance regardless of this fix.

**Weight usage:**
- 800 (ExtraBold) — headlines, product names, the wordmark
- 700 (Bold) — badges, VS marks, secondary emphasis
- 600 (SemiBold) — sub-headlines, price chips
- 400 (Regular) — body/caption text, tagline

**Capitalization:** Sentence case for headlines and body copy ("Software research you can verify."). All-caps only for short badge/label text (e.g. "COMPARISON", "PRICING UPDATE") — never for a full sentence or product name.

## 3. Color

**Background:** `#09090b` (`SITE_THEME_COLOR` in `lib/site.ts`) — near-black, not pure `#000`.

**Accent:** `#3458a8` — a calm, muted navy blue. This is the *only* accent color; it does not compete with the internal dashboards' semantic amber/emerald/red.

**Finding — brand drift (fixed this session):** every OG image and the `/api/social/card` generator used `#3b82f6` — a materially brighter, more saturated blue that does not exist anywhere else in the product. It was an arbitrary choice made when the card route was first built, then copied forward into every new template without checking it against `app/globals.css`'s real `--color-accent: #3458a8`. All four files now use `#3458a8` (`--color-accent-hover: #4a6fc0` exists for interactive UI states but has no equivalent in static images).

**Text colors** (standard Tailwind v4 zinc scale — verified consistent everywhere, no drift found):
- `white` — primary headlines
- `#a1a1aa` (zinc-400) — secondary/sub text
- `#71717a` (zinc-500) — tertiary/caption text (tagline, footer)
- `#e4e4e7` (zinc-200) — list-item text on the alternatives card

## 4. Layout & treatment

- **Padding:** 72px on full-bleed OG images (1200×630), 56px on the compare split-panel, 40px on the card generator.
- **Border radius:** 999px (full pill) for badges and circular VS marks; 8–10px for rectangular chips (price pill, numbered list markers); 40px for the apple-icon's rounded square; 7px for the 32×32 favicon.
- **No drop shadows, no gradients, no photography, no stock imagery, no fake screenshots, no fake logos.** Every image is flat color + typography, matching the brand's own "no decoration for its own sake" language.
- **Image treatment:** none — every social/OG image is 100% code-generated (`next/og`'s `ImageResponse`), never a hand-designed static asset (aside from the now-deleted `icon.png`). This is what makes every image reproducible, on-brand by construction, and driven by real data instead of copy-pasted templates.

## 5. Naming & tagline

- **Name:** always "Miloosh" — never "MiLoosh," "miloosh," or "Miloosh.com" in running text (the URL is fine in a link).
- **Tagline:** "Software research you can verify." — used verbatim everywhere (site footer, OG images, LinkedIn tagline field, manifest). Never paraphrased.
- **Description:** "Compare software alternatives, pricing, features, and migration options — every claim sourced and dated, so you can switch with confidence." — the canonical longer-form description (`SITE_DESCRIPTION`), used for meta descriptions, manifest, and as source text when a longer About-style blurb is needed.

## 6. Contact

`hello@miloosh.com` — the only correct address (fixed 2026-08-18; `hello@miloosh.app` has no MX records and cannot receive mail).

## 7. Visual template inventory (as of this audit)

| Surface | File | Distinct? |
|---|---|---|
| Homepage / fallback OG + Twitter card | `app/opengraph-image.tsx`, `app/twitter-image.tsx` | Wordmark + tagline, stacked |
| Comparison page OG image | `app/compare/[comparison]/opengraph-image.tsx` | X vs Y split panel |
| Software page OG image | `app/software/[slug]/opengraph-image.tsx` | Product name + optional real price pill |
| Category page OG image | `app/category/[slug]/opengraph-image.tsx` | Category name + real tool count |
| Social post card — `comparison` | `app/api/social/card/route.tsx` | X vs Y split panel (mirrors compare OG) |
| Social post card — `switching` | same file | A → B arrow layout |
| Social post card — `pricing` | same file | Headline + extracted `$` price chip |
| Social post card — `alternatives` | same file | Numbered pick list |
| Social post card — `category` | same file | Large stat number + category name |
| Social post card — `research` / default | same file | Stacked headline + sub (fallback for all kinds) |
| Favicon | `app/icon.tsx` | Plain "M" mark |
| Apple touch icon | `app/apple-icon.tsx` | Plain "M" mark (same as favicon) |

## 8. What to check before shipping any new template

1. Does it pass `fonts: await loadInterFonts()` to `ImageResponse`? (Easy to forget — Satori will silently fall back if you don't.)
2. Does it use `#3458a8` for accent, not a re-guessed blue?
3. Does it use real data (a real headline/price/count already produced upstream), never invented copy?
4. Has it been screenshotted at both the LinkedIn (1200×627) and Facebook (1200×630) aspect ratios it will actually render at?
5. Does the plain "M" mark — not the retired chevron graphic — appear anywhere the logo is shown?
