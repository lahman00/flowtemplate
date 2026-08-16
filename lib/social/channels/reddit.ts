import type { ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat } from "@/lib/social/channels/types";

/**
 * Reddit adapter — MANUAL_ONLY by explicit policy, not a technical gap.
 *
 * Real research (2026-08-16): Reddit's own Content Policy Rule 2 requires
 * "authentic" participation and prohibits content manipulation including
 * spam; Reddit's spam classifier explicitly weighs posting velocity,
 * account age/karma, and repeated-domain patterns — precisely the
 * signature a scheduled brand-content pipeline produces. Every
 * subreddit additionally layers its own, individually-moderated
 * self-promotion rules on top of site-wide policy. Commercial use of
 * Reddit's API also requires a separate paid agreement with Reddit, not
 * simple OAuth registration.
 *
 * Per this project's own build brief (Phase 5): "DO NOT automate
 * promotional posting on Reddit. Prepare only genuinely useful
 * participation opportunities and drafts for owner review." This
 * adapter therefore has no real publish path at all — it exists only so
 * Reddit can appear in the channel registry with an honest status, and
 * so the content engine can still prepare a draft for a human to review
 * and post themselves, in a specific relevant subreddit, by hand.
 */

const CHAR_LIMIT = 40000; // Reddit's real limit is generous; irrelevant here since this channel never auto-publishes.

export const redditAdapter: SocialAdapter = {
  channel: "reddit",
  requiredEnv: [],
  charLimit: CHAR_LIMIT,
  isConfigured: () => false,
  missingEnv: () => ["Reddit automation is intentionally not built — see file header. Manual, per-subreddit human review only."],
  format: (text, link) => defaultFormat(text, link, CHAR_LIMIT),

  async publish(variant: ChannelVariant, _options): Promise<PublishResult> {
    void _options;
    const body = defaultFormat(variant.text, variant.link, CHAR_LIMIT);
    return buildPublishResult({
      channel: "reddit",
      status: "MANUAL_ONLY",
      text: body,
      link: variant.link ?? "",
      error: "Reddit posting is never automated by this system (policy decision, not a technical gap) — this draft needs a human to pick a genuinely relevant subreddit, confirm its self-promotion rules, and post it personally.",
    });
  },
};
