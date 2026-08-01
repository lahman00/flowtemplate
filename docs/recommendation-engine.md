# Recommendation engine (Sprint 10)

`/recommend` turns Miloosh from a directory you search into a
decision tool you can answer questions and get matched by. The engine
behind it is **fully deterministic**: no LLM call, no external API, no
invented facts. Every point in every score traces back to a real field
already in `data/software/*.json` — `category`, `pricing.model`,
`platforms`, or a text search over `features`/`description`/`bestFor`.

## Why this exists

Comparison pages (`/compare`) answer "how do X and Y differ." The
recommendation engine answers a different question: "given my actual
situation, which tool should I even be looking at." Sprint 10's brief was
explicit that this is architecturally different work, not another
comparison page.

## The honesty constraint, and what it costs

The brief asked for 13 inputs: team size, budget, company stage,
industry, remote/office, required integrations, AI required, and five
category-need booleans (project management, CRM, knowledge base,
automation, communication), plus a difficulty preference. The dataset
doesn't have dedicated fields for most of these — there's no `teamSize`,
`industry`, or `difficulty` column anywhere. Rather than invent one, every
input is honored through the *most honest real signal available*:

- **Category needs** (PM/CRM/KB/automation/communication) — the strongest
  signal by far, because `category` is a real, single-valued field every
  entry has. A direct category match is worth more than any other factor
  (see the point table below).
- **AI required** — real text search for AI-related language in stored
  `features`/`description`.
- **Budget** — the real, if sparsely populated, `pricing.model` field.
  Most entries don't have one set (an honest gap carried over from
  Sprint 4), so budget fit is often scored as "not documented" rather than
  guessed.
- **Team size, company stage, difficulty preference** — text-match
  heuristics against `bestFor`/`description` (e.g. "teams of any size,"
  "enterprise," "simple," "advanced"). These are **not verified capability
  flags** — the absence of a matching phrase isn't evidence a product
  lacks that trait, just that we found no positive signal either way.
  Every generated explanation says "stored positioning text," never
  "confirmed," to keep that distinction visible to the user.
- **Remote/office** — a real but indirect proxy: `platforms` including
  both Web and a mobile OS is treated as remote-friendly, since cross-device
  access genuinely matters for distributed teams.
- **Required integrations** — real text search for the exact name the user
  typed, against stored `features`/`description`. A miss is explained as
  "not documented," not "unsupported" — our dataset just doesn't claim
  integration lists exhaustively.
- **Industry — never scored.** No software entry stores an industry or
  vertical. Rather than fake a match, the wizard still asks (for future
  use, and because removing the field entirely would be a bigger design
  change than this sprint asked for), but the results page shows an
  explicit "Industry not used in scoring" line with the reason, for every
  recommendation. This is the same pattern as the `CONS_DISCLOSURE` note
  on `/compare` pages: when the dataset can't honestly back a requested
  claim, say so instead of inventing one.

## Phase 1-2 — scoring

`lib/recommend/scoring.ts` exports `scoreSoftwareForAnswers(software,
answers)`, called once per product. Every point value is a named constant
at the top of the file:

| Signal | Points | Basis |
|---|---|---|
| Category primary match (per requested need) | +25 | `software.category` equals the requested need's category slug |
| Category keyword match (per requested need, if no primary match) | +8 | keyword search in features/description/bestFor |
| AI required and found | +15 | keyword search (`\bai\b`, "artificial intelligence", "machine learning") |
| AI required and not found | −15 | same search, no match |
| Budget "free" and pricing model free/open-source | +12 | `pricing.model` |
| Budget "free" and pricing model freemium | +6 | `pricing.model` |
| Budget "free" and pricing model paid | −10 | `pricing.model` |
| Budget "low" and a free tier exists | +10 | `pricing.model` / `pricing.hasFreeTier` |
| Budget "low" and no free tier | −6 | `pricing.model` |
| Team size / company stage keyword match | +10 / +8 | keyword search |
| Remote work: web + mobile platforms | +8 | `platforms` |
| Remote work: missing web or mobile | −5 | `platforms` |
| Each required integration mentioned | +6 | keyword search |
| Each required integration not mentioned | −5 | keyword search, absence |
| Difficulty preference matched / contradicted | +8 / −6 | keyword search |
| Pricing/platforms not documented, or industry given | 0 (informational) | explains why a dimension had no effect |

A factor is only ever added to the list if it actually applied — an
unanswered question (e.g. `teamSize: "unspecified"`) produces no factor at
all, not a zero-point placeholder. `totalScore` is the sum of every
factor's points, which **can be negative**. `maxPossibleScore` is the sum
of the best-case value for every dimension the user actually answered
(same for every product scored against one answer set), and
`matchPercent = round(max(0, totalScore) / maxPossibleScore * 100)` — the
one derived number shown prominently in the UI, with the full addition
always available underneath it. Nothing is hidden: this is the entire
formula, not a summary of it.

## Phase 3-4 — wizard and results

- `app/recommend/page.tsx` — a server component (for metadata) wrapping
  `components/recommend/RecommendWizard.tsx`, a "use client" 4-step
  mobile-first form (team → budget/industry → needs → integrations/
  difficulty) built from two small primitives,
  `components/recommend/OptionButton.tsx` (single-choice) and
  `components/recommend/ToggleCard.tsx` (boolean), styled consistently
  with the rest of the site's dark theme.
- On submit, the wizard encodes answers into a query string
  (`lib/recommend/query.ts`) and navigates to `/recommend/results`.
- `app/recommend/results/page.tsx` — a server component. Parses
  `searchParams` back into `RecommendationAnswers`, calls
  `getRecommendations()` (`lib/recommend/engine.ts`), and renders the top
  3: match %, why-recommended, pros (`generateProsList`, the same
  real-features-as-pros helper `/compare` pages use), cons
  (`CONS_DISCLOSURE`, the same honest non-fabrication note), a link to the
  full `/software/[slug]` page, and up to 3 related `/compare` pages via
  `getComparisonsInvolving`.
- Query-string results pages are excluded from the sitemap and marked
  `robots: { index: false, follow: false }` — every answer combination
  would otherwise look like near-duplicate content to a crawler.
  `/recommend` itself is indexable and in the sitemap.

## Phase 5 — explainability

Every `ScoreFactor` carries a `direction` (`positive` / `negative` /
`informational`) and a plain-language `explanation` naming the real field
behind it. The results page renders all three groups separately per
product — "why we recommended it," "what counted against it," and "not
used in this score" — so a negative or neutral factor is exactly as
visible as a positive one. Nothing is summarized away.

## Phase 6 — future AI readiness

The scoring interface is the seam: `ScoringStrategy` in
`lib/recommend/types.ts` is `(software, answers) => ScoringResult`.
`lib/recommend/engine.ts`'s `getRecommendations(answers, limit, scorer)`
takes that function as an optional third argument, defaulting to
`scoreSoftwareForAnswers`. A future AI-based scorer (or a version that
calls a real integrations database, once one exists) is a drop-in
replacement behind that same signature — the wizard, the results page, the
ranking, and the pros/cons/related-comparisons assembly never need to
change. **Nothing AI-based is implemented today** — this is a seam, not a
feature flag with a hidden AI path behind it.

## Phase 7 — analytics

`lib/recommend/events.ts` records three event types to a local,
first-party JSON log (`var/recommendation-events.json`, gitignored, no
third-party analytics):

- `recommendation_generated` — once per results-page render.
- `recommendation_shown` — once per product in the top 3, with its rank
  and match %.
- `recommendation_result_click` — when a user clicks through from results
  to a product's full page, via `components/recommend/TrackedRecommendationLink.tsx`
  and `app/api/recommendation-click/route.ts` (the internal-navigation
  analog of Sprint 9's `TrackedCtaLink`/`app/api/outbound-click`, which is
  for external vendor-site clicks).

All of this shares Sprint 9's single privacy switch,
`NEXT_PUBLIC_REVENUE_TRACKING_ENABLED` (off by default) — one toggle for
every first-party product-analytics concern on the site, not a new flag
per feature. A private report lives at `/internal/recommendations`
(noindex, disallowed in `app/robots.ts`, not linked from the site) —
same posture as `/internal/revenue` and `/internal/outbound-clicks`.

## Phase 8 — where things live

```
lib/recommend/
  types.ts        RecommendationAnswers, ScoreFactor, ScoringStrategy, SoftwareRecommendation
  keywords.ts      Every text-match dictionary used by scoring — one auditable place
  scoring.ts        scoreSoftwareForAnswers() — the deterministic engine
  engine.ts          getRecommendations() — ranks + assembles top-N
  query.ts            answers <-> URL query string, plus the audit-log summarizer
  events.ts             recommendation analytics (Phase 7)
components/recommend/
  OptionButton.tsx, ToggleCard.tsx    wizard input primitives
  RecommendWizard.tsx                  the 4-step client wizard
  TrackedRecommendationLink.tsx         results-page click tracking
app/
  recommend/page.tsx                    the wizard route
  recommend/results/page.tsx             the results route
  api/recommendation-click/route.ts       click-tracking endpoint
  internal/recommendations/page.tsx        private analytics report
```

## Known limitations (stated plainly, not hidden)

- Most `data/software/*.json` entries don't have `pricing.model` set, so
  budget scoring frequently lands on "not documented" rather than a real
  positive or negative signal. More pricing research would improve this;
  scoring shouldn't guess in its place.
- Team size, company stage, and difficulty are keyword heuristics against
  marketing copy, not verified attributes — see "the honesty constraint"
  above.
- Industry is collected but never scored — no dataset support exists yet.
- With only 34 software entries and a handful of categories, some answer
  combinations will surface a "closest available" match rather than a
  strong one. The engine always returns 3 recommendations (never fewer,
  never a hard empty state from over-filtering) and is honest in the UI
  when positive signal was thin.
