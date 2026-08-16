/**
 * Miloosh Social Media Operating System — shared types.
 *
 * Architecture ported (not copied) from Need Go Home's Python marketing
 * agent (~/NeeGoHome/agents/marketing-agent): adapter pattern with
 * is_configured/dry_run/publish, content-hash dedup, failure-isolated
 * per-channel results, JSONL-style history. Reimplemented in TypeScript
 * against this project's own stack (Vercel Blob persistence, matching
 * lib/revenue/affiliate-pipeline.ts's storage pattern, rather than local
 * JSONL files that don't survive serverless deploys).
 */

export const CHANNELS = [
  "linkedin",
  "facebook",
  "x",
  "bluesky",
  "mastodon",
  "threads",
  "reddit",
  "pinterest",
  "youtube",
  "instagram",
] as const;

export type Channel = (typeof CHANNELS)[number];

/** Ported directly from base.py's PublishResult status vocabulary. */
export type PublishStatus =
  | "PUBLISHED"
  | "DRY_RUN"
  | "SETUP_REQUIRED"
  | "DUPLICATE_SKIPPED"
  | "RATE_LIMITED"
  | "FAILED"
  | "MANUAL_ONLY"; // channel has no automatable API path at all (e.g. LinkedIn company pages, Reddit) — content is prepared, a human posts it

export type PublishResult = {
  channel: Channel;
  status: PublishStatus;
  text: string;
  link: string;
  postUrl: string | null;
  postId: string | null;
  /** True only when the publish was independently read back and confirmed live — a create-response is not proof by itself. */
  verified: boolean;
  error: string;
  contentHash: string;
};

/** Phase 14 dashboard vocabulary — one status per channel, independent of any single post's PublishStatus. */
export type ChannelHealthStatus = "CONNECTED" | "READY" | "NEEDS_OWNER_AUTH" | "API_COST_BLOCK" | "DISABLED" | "ERROR";

export const CONTENT_PILLARS = [
  "software_decisions", // A
  "pricing_intelligence", // B
  "alternatives", // C
  "migration", // D
  "buyer_education", // E
  "miloosh_research", // F
  "category_discovery", // G
  "trust_methodology", // H
  "commercial", // I
] as const;

export type ContentPillar = (typeof CONTENT_PILLARS)[number];

export const PILLAR_LABELS: Record<ContentPillar, string> = {
  software_decisions: "Software Decisions",
  pricing_intelligence: "Pricing Intelligence",
  alternatives: "Alternatives",
  migration: "Migration",
  buyer_education: "Buyer Education",
  miloosh_research: "Miloosh Research",
  category_discovery: "Category Discovery",
  trust_methodology: "Trust / Methodology",
  commercial: "Commercial",
};

export const QUEUE_STATES = ["IDEA", "DRAFTED", "QA_READY", "APPROVED_FOR_AUTO", "SCHEDULED", "PUBLISHED", "FAILED", "SKIPPED"] as const;

export type QueueState = (typeof QUEUE_STATES)[number];

/** Same shape as VALID_TRANSITIONS in affiliate-pipeline.ts — an explicit state machine so an invalid jump throws instead of silently corrupting the queue. */
export const VALID_QUEUE_TRANSITIONS: Record<QueueState, QueueState[]> = {
  IDEA: ["DRAFTED", "SKIPPED"],
  DRAFTED: ["QA_READY", "SKIPPED", "IDEA"],
  QA_READY: ["APPROVED_FOR_AUTO", "SCHEDULED", "SKIPPED", "DRAFTED"],
  APPROVED_FOR_AUTO: ["SCHEDULED", "SKIPPED"],
  SCHEDULED: ["PUBLISHED", "FAILED", "SKIPPED"],
  PUBLISHED: [],
  FAILED: ["SCHEDULED", "SKIPPED"], // allow a manual retry
  SKIPPED: [],
};

export function isValidQueueTransition(from: QueueState, to: QueueState): boolean {
  return VALID_QUEUE_TRANSITIONS[from].includes(to);
}

/** One platform-native rendering of a queue entry's content. */
export type ChannelVariant = {
  text: string;
  /** Canonical Miloosh URL before UTM tagging — UTM params are appended at publish time by lib/social/utm.ts, never baked into stored copy. */
  link: string | null;
  imageUrl: string | null;
  altText: string | null;
  hashtags: string[];
  /** Populated once a publish attempt (real or dry-run) has run for this channel. */
  publishResult: PublishResult | null;
};

export type SocialQueueEntry = {
  id: string;
  pillar: ContentPillar;
  /** Short stable topic key for the topic ledger — repeat-avoidance keys off this, not the id. */
  topic: string;
  /** Real Miloosh data this post is grounded in: software slugs, a comparison pair "a-vs-b", or a category slug. Never empty — every factual claim must trace back here. */
  sourceSlugs: string[];
  campaign: string | null;
  state: QueueState;
  createdAt: string;
  scheduledFor: string | null;
  channels: Partial<Record<Channel, ChannelVariant>>;
  qaNotes: string[];
  history: Array<{ state: QueueState; at: string; note: string | null }>;
};
