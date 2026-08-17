# Miloosh Facebook Groups — Launch Plan (2026-08-17)

Companion document to `data/social/facebook-groups.json` (the verified group dataset).
This file holds the creative/strategic output of the deep audit: drafts, UTM scheme,
and the 30-day rollout — kept separate from the evidence dataset so re-running the
audit never overwrites this plan.

**Status when written: read-only audit complete for CORE candidates. No group has
been joined, posted in, commented on, or messaged. Membership requests and the first
live posts require separate, explicit approval before they happen.**

## UTM scheme

```
utm_source=facebook
utm_medium=community
utm_campaign=<campaign>          # e.g. "groups_launch_2026_08"
utm_content=<community-post-id>  # e.g. "itmsp-2026-08-18-mfa-thread"
```

Built via the existing `buildUtmUrl()` helper (`lib/social/utm.ts`), same as the Page
automation — no new tracking code needed, just a new `channel` value ("facebook_community")
and a stable per-draft `utm_content` slug (below, per draft).

## 10 draft posts for CORE groups (NOT PUBLISHED)

Every CORE group whose rules were actually verified this session (all of them, except
the 4 not yet rules-checked) explicitly bans self-promotion and requires admin approval
for product/service links. So every draft below is **link-free, value-first,
participation content** — the honest reading of "respect verified link rules" for a
VALUE_ONLY community is that the first move is presence and insight, not a link. Where
a group's rules are still UNKNOWN, the draft is written the same way (safe default)
until verified.

---

**1. IT & MSP Business Owners Group** (`it-msp-business-owners-group`)
utm_content: `itmsp-launch-2026-08`
> Question for the MSP owners here: when you're evaluating a new tool for the stack (RMM, PSA, ticketing, whatever), what actually kills a vendor for you — pricing that doesn't scale with seat count, a support team that goes quiet after the sale, or a migration path that turns out to be a one-way door? Curious what's burned people the most.

**2. SaaS Marketing Group** (`saas-marketing-group`)
utm_content: `saasmkt-launch-2026-08`
> Genuine question for anyone who's run pricing-page experiments: has anyone actually A/B tested showing a competitor comparison table on the pricing page itself, vs. keeping comparisons off-site? I've seen arguments both ways (transparency vs. "why are you naming them") and I'm curious what people have actually measured, not just guessed.

**3. SaaS Founders Club** (`saas-founders-club`)
utm_content: `saasfc-launch-2026-08`
> Founders who've been through a pricing change — did you grandfather existing customers, migrate them on a timeline, or just flip the switch? I've seen all three tank a launch in different ways and I'm trying to figure out if there's an actual best practice or if it's just "depends on your churn tolerance."

**4. AI | AI Prompts & Automation for Business** (`ai-ai-prompts-automation-for-business`)
utm_content: `aiprompts-launch-2026-08`
> Not a prompt, more a process question: for the people actually running AI automations in production (not just demos) — what's your real failure mode? Mine's usually the handoff between "AI drafts it" and "human approves it" getting skipped under deadline pressure. Curious if that's universal or if I'm just undisciplined.

**5. AI & Automation for US-based Business Owners** (`ai-automation-for-us-based-business-owners`)
utm_content: `aiusbiz-launch-2026-08`
> For the business owners who've actually automated a real workflow (not a toy example) — what surprised you about the maintenance cost? Everyone talks about setup time, almost nobody talks about what breaks six months later when an API changes upstream.

**6. Business Automation** (`business-automation`)
utm_content: `bizauto-launch-2026-08`
> Curious how people here draw the line between "worth automating" and "not worth the setup time." I've seen teams spend a week automating something that took 10 minutes a month, and skip automating something that ate 2 hours a week for years. What's your actual threshold?

**7. SaaS Growth & Scale — Founders & Agency Owners** (`saas-growth-scale-founders-agency-owners`)
utm_content: `saasgrowth-launch-2026-08`
> For agency owners reselling or recommending software to clients: how do you handle it when the tool you recommended a year ago gets worse (price hike, feature removal, bad update)? Do you proactively flag it to clients or wait for them to notice?

**8. Startup group SaaS: Online Software & Services** (`startup-group-saas-online-software-services`)
utm_content: `startupsaas-launch-2026-08`
> Early-stage question: how many of you actually built a "buy vs. build" decision framework before picking your core stack, vs. just going with whatever you'd used before? I'm curious how much analysis actually happens at the 2-person-startup stage vs. later.

**9. Small Business AI and Automations** (`small-business-ai-and-automations`)
utm_content: `smbai-launch-2026-08`
> Small business owners — what's the first thing you automated that actually saved real time, vs. the thing you automated that sounded good but didn't move the needle? Trying to build an honest list, not a highlight reel.

**10. AI for Small Business Owners – Automations, Marketing & Growth** (`ai-for-small-business-owners-automations-marketing-growth`)
utm_content: `aismb-launch-2026-08`
> For anyone who's switched core business software recently (CRM, invoicing, whatever) — was the actual migration as painful as you expected, better, or worse? I keep hearing switching-cost horror stories and I'm trying to figure out how much is real vs. inertia talking.

---

## 30-day plan

**Week 1 — Join + observe + useful participation.**
Send join requests for CORE groups only (separate approval step — not done yet).
No posting in week 1. Read the last ~2 weeks of each group's feed, note recurring
questions, what gets removed, what tone lands. Answer 2-3 existing threads per group
with genuine, non-promotional help (no links) to build real presence before ever
starting a thread.

**Week 2 — Selective first posts.**
Post 1 draft (above) per CORE group, spaced across the week (not all on day one).
No links in any post. Monitor comments; respond personally.

**Week 3 — Expand winners.**
For groups where week 2 posts got real engagement (comments, not just reactions),
post a second, related discussion-starter. For groups with no traction, pause and
reassess rather than posting again on the same cadence.

**Week 4 — Double down based on real data.**
Shift effort toward the 2-3 groups with the best comment-to-member ratio, not the
biggest member count. Revisit whether a soft, rules-compliant mention of Miloosh
(e.g. "I run a site that does exactly this comparison, happy to share if useful — DM
me") is appropriate, per each group's admin-approval process — not before.

Group-specific posting cadence never exceeds each group's own rules (most are silent
on frequency, but "give more than you take" rules mean no more than ~1 post/group/week
during this phase, regardless of platform-side caps).
