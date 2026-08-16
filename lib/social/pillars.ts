/**
 * Evergreen concept banks for the two content pillars that aren't
 * generated from a specific software/comparison/category record —
 * Buyer Education (E) and Trust/Methodology (H). These are genuine
 * general-purpose advice and honest statements about how Miloosh itself
 * works, not claims about any specific product, so writing them directly
 * (rather than generating them from data) doesn't risk fabricating a
 * product fact. Each is real editorial content — not a template with
 * blanks — written once and reused with the topic-repeat cooldown like
 * any other queue entry.
 */

export type EvergreenConcept = {
  topic: string;
  headline: string;
  body: string;
};

export const BUYER_EDUCATION_CONCEPTS: EvergreenConcept[] = [
  { topic: "feature-count-fallacy", headline: "Don't compare SaaS tools by feature count alone.", body: "A longer feature list usually means more surface area to learn, not more value for your actual workflow. The right question isn't \"which tool has more features\" — it's \"which tool's core loop matches how my team already works.\"" },
  { topic: "free-tier-reality-check", headline: "A free tier is a trial, not a business model decision.", body: "Free tiers exist to get you in the door. Before you commit a team's workflow to a tool, check what breaks — seat limits, feature gates, storage caps — the moment you'd actually need to scale." },
  { topic: "migration-cost-is-real", headline: "The cost of switching software is never just the subscription price.", body: "Data export quality, integration rebuild time, and team retraining are the real costs of a migration. A cheaper tool that costs a month of setup isn't automatically the cheaper choice." },
  { topic: "trial-period-discipline", headline: "A 14-day trial only tells you what week one feels like.", body: "Most workflow friction shows up in week three, not day two. If you can, run a trial through at least one full work cycle — a sprint, a billing cycle, a content calendar — before deciding." },
  { topic: "integrations-before-features", headline: "Check the integrations page before the features page.", body: "A tool with fewer features but a real, working integration with what you already use will usually beat a feature-rich tool that leaves you re-entering data by hand." },
  { topic: "pricing-page-red-flags", headline: "\"Contact us for pricing\" is information too.", body: "It usually means the vendor expects a sales conversation, per-seat negotiation, or a longer commitment than a self-serve tool. Not a dealbreaker — but worth knowing before you invest evaluation time." },
  { topic: "team-size-mismatch", headline: "The best tool for a 5-person team is rarely the best tool for a 50-person team.", body: "Permission models, admin controls, and audit trails matter a lot more once you're not the only person who can see everything. Match the tool to the org you'll be in a year from now, not just today." },
  { topic: "lock-in-signals", headline: "Before you commit, ask: can I get my data back out?", body: "Real export formats (CSV, API access, standard file types) versus proprietary-only formats is one of the most overlooked factors in a software decision — and one of the most expensive to discover too late." },
  { topic: "reviews-vs-fit", headline: "A 4.8-star rating tells you almost nothing about fit for your use case.", body: "Aggregate ratings average across every use case a tool serves. A tool built for enterprise sales teams can be five-star-rated and still be the wrong choice for a two-person agency." },
  { topic: "decision-paralysis", headline: "You don't need to evaluate 12 tools to make a good decision.", body: "Past a shortlist of 3, more options tend to add confusion, not confidence. Pick your two or three non-negotiable requirements first, then compare only the tools that clear that bar." },
];

export const TRUST_METHODOLOGY_CONCEPTS: EvergreenConcept[] = [
  { topic: "why-dates-matter", headline: "Every claim on Miloosh carries the date we last checked it.", body: "Software pricing and features change constantly. A comparison without a verification date is a comparison you can't actually trust — so every page on Miloosh shows exactly when the underlying facts were last confirmed." },
  { topic: "sourced-not-scraped", headline: "We source every factual claim, not scrape it from a review aggregator.", body: "Pricing, features, and positioning come from the vendor's own official pages, checked directly — not copied from other \"best of\" lists that may themselves be years out of date." },
  { topic: "no-fake-rankings", headline: "We don't publish \"best of\" rankings with no methodology behind them.", body: "A numbered list implies precision that most software comparisons don't actually have. Where we do rank or recommend, the criteria are stated up front — not hidden behind a vague \"our experts recommend.\"" },
  { topic: "affiliate-transparency", headline: "Yes, some of our links are affiliate links. Here's exactly how that works.", body: "When a link earns us a commission, we disclose it — visibly, not in fine print. It never changes which tool we say is the better fit; it only affects which link you click if you've already decided." },
  { topic: "correction-policy", headline: "If we get a fact wrong, we fix it — and we say so.", body: "Software research is never static. When a pricing page changes or a feature gets deprecated, we update the page and the verification date, rather than letting stale information sit indefinitely." },
  { topic: "no-pay-for-placement", headline: "A vendor can't pay to move up a comparison.", body: "Commercial relationships (affiliate programs) are separate from editorial judgment. Which product we say fits a given need is decided by the facts on that product's own page, not by which vendor pays a commission." },
  { topic: "what-verified-means", headline: "\"Verified\" on Miloosh means we checked the vendor's own current page — not a summary of one.", body: "Every software entry links to the actual sources it was built from, so you can go check the primary source yourself in seconds, not just take our word for it." },
  { topic: "why-we-started", headline: "We built Miloosh because most software comparisons read like they were written once in 2019 and never touched again.", body: "Outdated pricing, dead feature comparisons, \"top 10\" lists with tools that no longer exist. Software research should be a living document, not a one-time blog post." },
  { topic: "independent-research", headline: "Miloosh isn't owned by, or built for, any single software vendor.", body: "That independence is the entire point. A comparison that's actually neutral has to start from a structure with no incentive to tilt the outcome." },
  { topic: "what-we-dont-do", headline: "We don't publish speculative claims about products we haven't verified.", body: "If we can't confirm a fact against a primary source, we say so explicitly rather than filling the gap with something that sounds plausible. Unverified isn't the same as false — but it's not something we'll present as settled either." },
];
