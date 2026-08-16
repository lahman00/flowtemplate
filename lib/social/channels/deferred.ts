import type { Channel, ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat } from "@/lib/social/channels/types";

/**
 * Factory for channels evaluated in Phase 2 research and deliberately
 * NOT built out as real adapters yet — Pinterest, Instagram, and YouTube.
 * Each requires infrastructure this text/link-first content engine
 * doesn't have (a real image pipeline for Pinterest/Instagram, or actual
 * video production for YouTube Shorts), so building a real adapter now
 * would be premature per this project's "don't build ahead of a real
 * need" convention. Kept in the channel registry with an honest,
 * specific status rather than silently omitted, so the dashboard can
 * still show why each is not yet active.
 */
export function deferredAdapter(channel: Channel, reason: string): SocialAdapter {
  return {
    channel,
    requiredEnv: [],
    charLimit: 2000,
    isConfigured: () => false,
    missingEnv: () => [reason],
    format: (text, link) => defaultFormat(text, link, 2000),
    async publish(variant: ChannelVariant, _options): Promise<PublishResult> {
      void _options;
      const body = defaultFormat(variant.text, variant.link, 2000);
      return buildPublishResult({ channel, status: "SETUP_REQUIRED", text: body, link: variant.link ?? "", error: reason });
    },
  };
}

export const pinterestAdapter = deferredAdapter(
  "pinterest",
  "Deferred: Pinterest is image-first (every Pin requires an image) and gates new apps behind Trial access, where Pins are invisible to the public until a separate Standard-access video-demo review is approved. Not worth building until Miloosh commits to a real per-post image pipeline."
);

export const instagramAdapter = deferredAdapter(
  "instagram",
  "Deferred: requires a Business/Creator account linked to a Facebook Page, Meta App Review, JPEG-only images hosted on a public URL (no direct upload), and is not a text/link-first platform. Revisit alongside Pinterest if an image pipeline is built."
);

export const youtubeAdapter = deferredAdapter(
  "youtube",
  "Skipped: YouTube Shorts requires an actual rendered video file — the Data API's videos.insert errors without one — which is a fundamentally different production pipeline (script, footage/motion graphics, edit, render) than text/image social posts. Also requires a Google verification review before uploads are publicly visible. Revisit only if Miloosh commits to video production."
);
