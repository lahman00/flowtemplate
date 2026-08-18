# 30-Day Editorial Calendar — LinkedIn Company Page

Starts 2026-08-19. Every topic below was pulled directly from `generateAllRawIdeas()` — the same real, data-grounded generator that already produces the 2,467-entry approved backlog Facebook publishes from daily. Nothing here is invented; each row traces to a real Miloosh page.

**Cadence:** 3×/week (Mon/Wed/Fri) — deliberate, not daily. At 2 followers and 2 posts, a company page earns trust by being consistently useful, not by maximizing volume. Facebook's separate daily 13:00 America/New_York auto-publish is unaffected and continues on its own real schedule.

**Copy:** final platform-native copy for each post is drafted at schedule time via the existing `renderForChannel` pipeline (the same system that wrote the 2 live posts and tomorrow's prepared Miro/Lucidchart post) — not pre-written wholesale here, since hand-writing 13 posts' final copy today would just be redone by the real pipeline anyway, and drafting close to publish keeps facts fresher (see `checkStaleClaim` in the QA gates).

| Date | Pillar | Topic | Destination | Visual kind |
|---|---|---|---|---|
| Wed 2026-08-19 | B (X vs Y) | Miro vs Lucidchart: what actually differs? | `/compare/miro-vs-lucidchart` | comparison — **fully prepared, see `TOMORROW_POST_2026-08-19.md`** |
| Fri 2026-08-21 | E (Switching) | Moving from Slack to Discord? Check these things first. | `/compare/slack-vs-discord` | switching |
| Mon 2026-08-24 | C (Pricing) | What does Todoist really cost? | `/software/todoist` | pricing |
| Wed 2026-08-26 | F (Category) | 12 Project Management tools, compared on real criteria. | `/category/project-management` | category |
| Fri 2026-08-28 | G (Buyer mistakes) | Don't compare SaaS tools by feature count alone. | `/sources-policy` (evergreen, no product link) | comparison (stacked fallback — no split-panel data) |
| Mon 2026-08-31 | B (X vs Y) | Notion vs ClickUp: what actually differs? | `/compare/notion-vs-clickup` | comparison |
| Wed 2026-09-02 | D (Alternatives) | 3 alternatives to Notion, depending on what you actually need. | `/software/notion` | alternatives |
| Fri 2026-09-04 | J (Commercial) | Airtable — moving off spreadsheets toward custom interfaces. | `/software/airtable` | pricing/profile |
| Mon 2026-09-07 | E (Switching) | Moving from ClickUp to Asana? Check these things first. | `/compare/clickup-vs-asana` | switching |
| Wed 2026-09-09 | H/I (Research) | We verified Moosend's pricing and features on 2026-08-19. | `/software/moosend` | research |
| Fri 2026-09-11 | G (Buyer mistakes) | A free tier is a trial, not a business model decision. | `/sources-policy` (evergreen) | comparison (stacked fallback) |
| Mon 2026-09-14 | B (X vs Y) | Slack vs Microsoft Teams: what actually differs? | `/compare/slack-vs-microsoft-teams` | comparison |
| Wed 2026-09-16 | J (Commercial) | ElevenLabs — who it's actually built for. | `/software/elevenlabs` | pricing/profile |

## On pillar J (affiliate-commercial)

Airtable, Monday, ElevenLabs, Wix, and Shopify are the pipeline's "activated" tier (see `AFFILIATE_EDITORIAL_MATRIX.md`) — but as documented there, **none currently have a live affiliate link in production** (no env vars set). The 2 J-pillar slots above (Airtable, ElevenLabs) are scheduled as pure editorial coverage — same as any other product page — with no different framing than a non-commercial post would get. If Eyal activates any of these before the post date, `shouldShowAffiliateDisclosure()` will automatically add the disclosure with zero further work; nothing about the copy needs to change either way.

## Remaining real candidates (not scheduled, held in reserve)

Pulled but not assigned a date — available for the next calendar cycle or to swap in if a scheduled topic goes stale: Notion vs Coda, Notion vs Confluence, Constant Contact pricing, Brevo pricing, alternatives to Slack/ClickUp, moving from ClickUp to Monday, Communication/CRM category posts, 2 more buyer-education pieces, 2 more trust/methodology pieces, Monday.com commercial coverage, Volza research update.
