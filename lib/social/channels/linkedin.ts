import type { ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat } from "@/lib/social/channels/types";

/**
 * LinkedIn adapter — MANUAL_ONLY by design, not a missing feature.
 *
 * Real research (2026-08-16, directly fetched from learn.microsoft.com/
 * linkedin): posting to a LinkedIn COMPANY PAGE requires the Community
 * Management API (w_organization_social scope), which is gated behind
 * LinkedIn's formal partner-application process — legal-entity
 * verification, a Page-admin app-association check, a Development Tier
 * review, then a Standard Tier review requiring a narrated screencast of
 * the working OAuth flow. LinkedIn explicitly reserves the right to
 * decline qualified applicants, publishes no guaranteed review timeline,
 * and publishes no self-serve fee. The only self-serve, no-approval
 * LinkedIn product ("Share on LinkedIn", w_member_social) posts to a
 * PERSONAL profile, not a company page — not a fit for Miloosh's brand
 * page.
 *
 * Given that, this adapter always returns MANUAL_ONLY: the content
 * engine and QA gates still produce a fully platform-native, ready-to-
 * paste LinkedIn variant, but a human copies it in — never a fabricated
 * "PUBLISHED" for a channel this codebase cannot actually post to. If
 * the owner later completes LinkedIn's partner application and the
 * Posts API becomes available, replace this file's publish() with a real
 * OAuth 2.0 + Posts API call; the interface won't need to change.
 */

const CHAR_LIMIT = 3000; // LinkedIn's real post limit; kept short in practice by the content engine.

export const linkedinAdapter: SocialAdapter = {
  channel: "linkedin",
  requiredEnv: [],
  charLimit: CHAR_LIMIT,
  isConfigured: () => false, // never "configured" for auto-publish — see file header
  missingEnv: () => ["LinkedIn Community Management API partner approval (no env var can substitute — see setup pack)"],
  format: (text, link) => defaultFormat(text, link, CHAR_LIMIT),

  async publish(variant: ChannelVariant, _options): Promise<PublishResult> {
    void _options;
    const body = defaultFormat(variant.text, variant.link, CHAR_LIMIT);
    return buildPublishResult({
      channel: "linkedin",
      status: "MANUAL_ONLY",
      text: body,
      link: variant.link ?? "",
      error: "LinkedIn company-page posting requires Community Management API partner approval — no self-serve path exists. Copy this text and post manually, or complete the partner application to enable automation.",
    });
  },
};
