# LinkedIn Historical Post QA

Audited 2026-08-18 against the live authenticated Company Page (linkedin.com/company/141163964/admin/page-posts/published). Both posts published 2026-08-14 by Eyal Haimovich (Founder), each with real, non-zero organic reach.

## Post 1 — "Choosing software for a business sounds simple..."

- **Published:** 2026-08-14 · **Organic impressions:** 32
- **Copy:** "Choosing software for a business sounds simple until you actually start comparing the options. The pricing page tells you one thing. User reviews tell you another. And comparison articles do not always make it clear where the information came from, when it was updated, or what really changes from one product to another. At Miloosh, we are trying to solve exactly that problem. We go through official sources, pricing pages, product documentation, features, limitations and migration options, then bring the important information together in a way that can also be checked independently. The goal is not to crown one product as 'the best.' The goal is to understand who each tool is for, what you get at each price point, where the limitations are, and what is worth knowing before making a decision. We believe good software research should help you make a decision, not push you toward a sale."
- **Destination:** `https://miloosh.com` — live, resolves correctly.
- **Visual:** generic black "Miloosh" wordmark card — the only template that existed when this was published (pre-dates commit 44366be's visual system). Rendered in Satori's fallback font at publish time (pre-dates this session's font fix), so the *baked-in PNG* on this live post is permanently in the wrong typeface — reprocessing it would require replacing the post's attached image via "Edit post," not something the text edit alone fixes.
- **Logo:** correct plain "M" mark (canonical).
- **Factual accuracy:** no product claims, no pricing, no invented statistics — a pure positioning statement. Nothing to fact-check.
- **Tracking:** bare `https://miloosh.com`, **no UTM parameters** — this post's traffic cannot be attributed to "LinkedIn organic, post 1" in analytics beyond a generic linkedin.com referrer.
- **Branding:** consistent with the brand standard's voice — honest, declines to crown a "best," no overclaiming.

**Classification: KEEP.** No branding, factual, or broken-link problem, and the generic image is not a *severe* visual-quality problem — it's simply from before the visual system existed, which is expected, not an error. Real engagement (32 impressions) already accrued.

## Post 2 — "Software comparisons are everywhere..."

- **Published:** 2026-08-14 (same day as Post 1) · **Organic impressions:** 57
- **Copy:** "Software comparisons are everywhere. What is harder to find is software research you can actually check for yourself. That is why we built Miloosh. We look at pricing, features, alternatives and migration options, then trace the information back to real sources so people can make better software decisions with more confidence. We are not here to tell you which tool is the best. We are here to make the decision easier to understand and easier to verify."
- **Destination:** `https://miloosh.com` — live, resolves correctly.
- **Visual / Logo / Factual accuracy:** same findings as Post 1.
- **Tracking:** same gap — no UTM.
- **Overlap with Post 1:** both are "why Miloosh exists" positioning posts published the same day — expected for a launch pair, not accidental duplication of a single message.

**Classification: KEEP.** Same reasoning as Post 1.

## Editing capability (verified, not assumed)

Opened the post control menu ("...") on Post 1 and confirmed LinkedIn organic posts **do** support "Edit post" without deleting the post or its accrued engagement (menu also offers Delete, Manage featured, Copy link — no destructive action was taken; the menu was closed via Escape). This means if a *future* post ever needs a genuine correction, editing in place is available and should be tried before removal. Neither post here needs it.

## The one real gap: no UTM on either post

Both live posts link to the bare homepage with no campaign tracking. This isn't a defect worth editing two small, already-published launch posts over, but it's the exact gap the new `/api/social/card` pipeline and any future LinkedIn publishing must not repeat — see Phase 9's technical QA gate.
