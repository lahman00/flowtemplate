# 7-Day LinkedIn READY Queue

Built 2026-08-19. Every claim below traces to a real, sourced Miloosh data file — verified at write time, links checked live (200) this pass. Cadence: Mon/Wed/Fri, matching `30_DAY_EDITORIAL_CALENDAR.md`. None of these are published.

---

## Day 1 — Wed 2026-08-19 (tomorrow)

Fully specified in `TOMORROW_POST_2026-08-19.md` — Miro vs Lucidchart. Summarized here for queue completeness; that file is the source of truth.

- **Topic:** Miro vs Lucidchart — what actually differs
- **Objective:** Establish Miloosh's first real comparison post; earn a save/share from someone actively evaluating either tool
- **Audience:** Product/design/ops leads choosing a visual-collaboration tool
- **URL:** `https://miloosh.com/compare/miro-vs-lucidchart` (UTM per that file)
- **Visual:** comparison card, ready
- **Affiliate relationship:** none live (Miro is `approved` pipeline-stage only)
- **QA status:** ✅ complete — copy, visual, links, UTM all verified

---

## Day 2 — Fri 2026-08-21

- **Topic:** Switching from Slack to Discord
- **Objective:** Reach teams actively re-evaluating their chat tool, not just browsing
- **Audience:** Team leads/ops managing internal communication tooling
- **Source/evidence:** `data/software/slack.json`, `data/software/discord.json` — Slack's own positioning ("workplace communication... replace email-based workflows"), Discord's own positioning ("vendor positions it primarily for gaming communities and friend groups... rather than formal meetings")
- **Post copy:**
  > Slack and Discord get compared more often than they should be — they're not really competing for the same team.
  >
  > Slack is built around searchable, channel-based work communication: huddles, workflow automation, integrations tied to how a business actually operates. Discord is built around low-latency voice and real-time community presence — its own positioning is explicit that it's for communities and casual spaces, not formal team workflows.
  >
  > If you're evaluating a switch because Slack's pricing is the pain point, that's a real reason to look elsewhere — but Discord solving that pain comes with a real tradeoff in structure. We laid out exactly what changes: [link]
- **URL:** `https://miloosh.com/compare/slack-vs-discord?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=slack-vs-discord-2026-08-21-fri`
- **Visual concept:** `switching` card kind — "Slack → Discord" arrow layout
- **Affiliate relationship:** none
- **Disclosure required:** no
- **QA status:** ✅ complete — copy sourced, visual rendered and screenshotted (correct logo/font/accent, no text collision), destination link live (200)

---

## Day 3 — Mon 2026-08-24

- **Topic:** What Todoist actually costs
- **Objective:** Real pricing-intelligence post — the exact tier structure, not a vague "affordable" claim
- **Audience:** Individuals/small teams evaluating task-management tools on budget
- **Source/evidence:** `data/software/todoist.json`'s `pricing` block, verified 2026-08-19 directly against `todoist.com/pricing`
- **Post copy:**
  > Todoist's pricing is simpler than most task managers, but the free tier's real limit is easy to miss: 5 active projects.
  >
  > Free: 5 projects, 3 filter views, list/board layout, 1 week of activity history.
  > Pro: $5/month (billed annually) — 300 projects, calendar view, full activity history, AI task assist.
  > Business: $8/user/month (billed annually) — shared workspaces, team activity logs, role permissions.
  >
  > The jump from free to Pro isn't really about features most people notice day one — it's the project cap. If you're still on the free plan and hitting "5 active projects," that's the actual trigger point, not a feature you're missing.
- **URL:** `https://miloosh.com/software/todoist?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=todoist-2026-08-24-mon`
- **Visual concept:** `pricing` card kind — price pill showing "$5/month"
- **Affiliate relationship:** none (Todoist is `submitted` pipeline-stage only, not live)
- **Disclosure required:** no
- **QA status:** ✅ complete — copy sourced, visual rendered and screenshotted (correct logo/font/accent, no text collision), destination link live (200)

---

## Day 4 — Wed 2026-08-26

- **Topic:** 12 Project Management tools, compared on real criteria
- **Objective:** Category-authority post — signal Miloosh covers the space broadly, not just the famous 3-4 tools
- **Audience:** Anyone starting a PM-tool search from scratch
- **Source/evidence:** `data/categories/categories.json` + a live count of `data/software/*.json` entries tagged `project-management`: Asana, Basecamp, ClickUp, Jira, Linear, Monday.com, Shortcut, Smartsheet, Teamwork, Trello, Wrike, Zoho Projects (12, counted this pass)
- **Post copy:**
  > Most "best project management tools" lists cover the same four or five names. We currently track 12 on Miloosh, each with sourced pricing and features: Asana, Basecamp, ClickUp, Jira, Linear, Monday.com, Shortcut, Smartsheet, Teamwork, Trello, Wrike, and Zoho Projects.
  >
  > The right one usually isn't the most popular one — it's the one whose default view matches how your team already thinks about work (boards vs. lists vs. timelines), and whose pricing survives your team actually growing.
- **URL:** `https://miloosh.com/category/project-management?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=category-project-management-2026-08-26-wed`
- **Visual concept:** `category` card kind — "12 TOOLS" stat block
- **Affiliate relationship:** none
- **Disclosure required:** no
- **QA status:** ✅ complete — copy sourced, visual rendered and screenshotted (correct logo/font/accent, no text collision), destination link live (200)

---

## Day 5 — Fri 2026-08-28

- **Topic:** Buyer mistake — comparing tools by feature count
- **Objective:** Evergreen trust-building post; no product page, pure editorial value
- **Audience:** Anyone mid-evaluation of any SaaS category
- **Source/evidence:** `lib/social/pillars.ts`'s `BUYER_EDUCATION_CONCEPTS` (real, pre-written evergreen editorial content, not generated for this post)
- **Post copy:**
  > A longer feature list usually means more surface area to learn — not more value for your actual workflow.
  >
  > We see this constantly building comparisons: the tool with 40 listed features isn't the better choice for a team that needs 6 of them done well. The right question isn't "which tool has more features" — it's "which tool's core loop matches how the team already works."
  >
  > Worth remembering before the next vendor demo.
- **URL:** `https://miloosh.com/sources-policy?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=feature-count-fallacy-2026-08-28-fri` (evergreen post — links to methodology, not a specific product)
- **Visual concept:** stacked-headline fallback (no product-pair data to drive a split-panel layout)
- **Affiliate relationship:** none
- **Disclosure required:** no
- **QA status:** ✅ complete — copy is the pre-approved evergreen text verbatim (no new fact-checking needed); stacked-fallback visual is the same layout already verified elsewhere this session

---

## Day 6 — Mon 2026-08-31

- **Topic:** Notion vs ClickUp — what actually differs
- **Objective:** High-search-volume comparison; strong SEO/social overlap
- **Audience:** Teams choosing between an all-in-one workspace (Notion) and a dedicated PM tool (ClickUp)
- **Source/evidence:** `data/software/notion.json`, `data/software/clickup.json`
- **Post copy:**
  > Notion and ClickUp both call themselves "all-in-one" — they mean different things by it.
  >
  > Notion centers on flexible docs and a connected knowledge base — wikis, nested pages, AI search across what your team has already written. ClickUp centers on structured project execution — task hierarchy, Gantt charts, dashboards built from live task data.
  >
  > If your team's biggest problem is "we can't find anything we wrote down," that's a Notion-shaped problem. If it's "we can't see what's actually late," that's a ClickUp-shaped one. We compared the real feature sets: [link]
- **URL:** `https://miloosh.com/compare/notion-vs-clickup?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=notion-vs-clickup-2026-08-31-mon`
- **Visual concept:** `comparison` card kind — split panel
- **Affiliate relationship:** none
- **Disclosure required:** no
- **QA status:** ✅ complete — copy sourced, visual rendered and screenshotted (correct logo/font/accent, no text collision), destination link live (200)

---

## Day 7 — Wed 2026-09-02

- **Topic:** 3 alternatives to Notion, depending on what you need
- **Objective:** Capture "Notion alternative" search/social intent with a non-generic answer
- **Audience:** Notion users hitting a specific limitation, not shopping generally
- **Source/evidence:** `data/software/notion.json`'s real `alternatives` array
- **Post copy:**
  > "What's a good Notion alternative" doesn't have one answer — it depends what's actually not working.
  >
  > Need more structured project management? ClickUp. Building custom internal workflows and tools? Coda. Managing large-team structured documentation? Confluence.
  >
  > There's no single "best Notion alternative" — there's the one that fixes the specific thing Notion isn't doing for your team.
- **URL:** `https://miloosh.com/software/notion?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-launch-2026-08&utm_content=notion-alternatives-2026-09-02-wed`
- **Visual concept:** `alternatives` card kind — numbered pick list
- **Affiliate relationship:** none
- **Disclosure required:** no
- **QA status:** ✅ complete — copy sourced, visual rendered and screenshotted (correct logo/font/accent, no text collision), destination link live (200)

---

## What's left before each goes live

All 7 days have sourced copy and a rendered, screenshotted, QA'd visual as of this pass (Day 1's full detail is in `TOMORROW_POST_2026-08-19.md`). Nothing here is published. Two things worth doing again right before each actual post date, not now: (1) re-run the destination link check in case a page moves, (2) re-render the visual if the brand standard changes between now and then — mechanical, not a new design decision.
