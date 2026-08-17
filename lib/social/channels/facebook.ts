import type { ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat, envAll, missingEnvNames } from "@/lib/social/channels/types";
import { SITE_URL } from "@/lib/site";

/**
 * Facebook Page adapter — ported from Need Go Home's real, working
 * publishers/facebook.py (Graph API), extended 2026-08-17 with real image
 * posting (verified against Meta's current Graph API reference before
 * implementing — developers.facebook.com/docs/graph-api/reference/page/photos/):
 *
 *   IMAGE_POST (when the variant has a valid, Miloosh-owned image):
 *     POST /{page-id}/photos  url=<image-url>&caption=<text>&access_token=<token>
 *     -> { "id": "<photo-id>", "post_id": "<pageid>_<storyid>" }
 *     Same permission as feed posting (pages_manage_posts) — no extra
 *     scope needed. `url` must point to a photo already hosted on the
 *     public internet; Meta's own servers fetch it — this code never
 *     downloads or proxies image bytes itself. `caption` (not the
 *     deprecated `message`) is the correct field for /photos.
 *     Meta's docs do not state whether a URL inside `caption` becomes a
 *     clickable link (checked; genuinely undocumented) — so the
 *     destination URL is included in the caption as visible, copyable
 *     text for a reader, without assuming it's a real hyperlink.
 *
 *   LINK_POST (no valid image — the pre-existing behavior, unchanged):
 *     POST /{page-id}/feed  message=<text-with-link>&access_token=<token>
 *     -> { "id": "<pageid>_<storyid>" }
 *
 *   Both: GET /{post-id}?fields=id,permalink_url (read-back verification).
 *
 * A Page Access Token never expires, so this runs unattended after
 * one-time setup. The token travels in the request body (form-encoded),
 * never the URL, so it can't leak through a request line or access log.
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const CHAR_LIMIT = 2000; // Facebook allows far more; keep posts short and readable.
const REQUIRED_ENV = ["SOCIAL_FACEBOOK_PAGE_ID", "SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN"];

/**
 * Only ever trust an image URL that is Miloosh's own generated social
 * card, served from Miloosh's own domain via the one real image route
 * (app/api/social/card/route.tsx). Never pass an arbitrary/untrusted URL
 * to Meta's `url` fetch-by-reference parameter — this is the sole
 * validation gate, and it fails closed (anything that doesn't match
 * falls back to a plain link post, never an error that could be
 * mistaken for "post it anyway").
 */
function isTrustedSocialImageUrl(url: string): boolean {
  return url.startsWith(`${SITE_URL}/api/social/card?`);
}

export const facebookAdapter: SocialAdapter = {
  channel: "facebook",
  requiredEnv: REQUIRED_ENV,
  charLimit: CHAR_LIMIT,
  isConfigured: () => envAll(REQUIRED_ENV) !== null,
  missingEnv: () => missingEnvNames(REQUIRED_ENV),
  format: (text, link) => defaultFormat(text, link, CHAR_LIMIT),

  async publish(variant: ChannelVariant, { dryRun }): Promise<PublishResult> {
    const body = defaultFormat(variant.text, variant.link, CHAR_LIMIT);
    const link = variant.link ?? "";
    const useImage = Boolean(variant.imageUrl && isTrustedSocialImageUrl(variant.imageUrl));
    const mode: PublishResult["mode"] = useImage ? "IMAGE_POST" : "LINK_POST";
    const env = envAll(REQUIRED_ENV);

    if (!env) {
      return buildPublishResult({ channel: "facebook", status: "SETUP_REQUIRED", text: body, link, mode, error: `missing env: ${missingEnvNames(REQUIRED_ENV).join(", ")}` });
    }
    if (dryRun) {
      // No network call of any kind — including no fetch of the image
      // URL itself — this is the entire point of a dry run.
      return buildPublishResult({ channel: "facebook", status: "DRY_RUN", text: body, link, mode });
    }

    const pageId = env.SOCIAL_FACEBOOK_PAGE_ID;
    const token = env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN;

    try {
      const createRes = useImage
        ? await fetch(`${GRAPH_BASE}/${pageId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ url: variant.imageUrl!, caption: body, access_token: token }),
          })
        : await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ message: body, access_token: token }),
          });

      if (createRes.status === 429) {
        return buildPublishResult({ channel: "facebook", status: "RATE_LIMITED", text: body, link, mode, error: "rate limited (HTTP 429)" });
      }
      if (createRes.status === 401 || createRes.status === 403) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, mode, error: `auth failed HTTP ${createRes.status}` });
      }
      if (!createRes.ok) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, mode, error: `HTTP ${createRes.status}` });
      }
      const created = (await createRes.json()) as { id?: string; post_id?: string };
      // /photos returns both a photo id and the actual feed post id (post_id) — the post id is what we want for the permalink read-back; /feed only ever returns id.
      const postId = created.post_id ?? created.id;
      if (!postId) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, mode, error: "no post id in Graph response" });
      }

      let postUrl: string | null = null;
      let verified = false;
      try {
        const infoRes = await fetch(`${GRAPH_BASE}/${postId}?fields=id,permalink_url&access_token=${encodeURIComponent(token)}`);
        if (infoRes.ok) {
          const info = (await infoRes.json()) as { id?: string; permalink_url?: string };
          if (info.id) {
            verified = true;
            postUrl = info.permalink_url ?? null;
          }
        }
      } catch {
        verified = false; // read-back is best-effort only
      }
      if (!postUrl) postUrl = `https://www.facebook.com/${postId}`;

      return buildPublishResult({ channel: "facebook", status: "PUBLISHED", text: body, link, mode, postUrl, postId, verified });
    } catch (err) {
      return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, mode, error: `${err instanceof Error ? err.constructor.name : "Error"}: ${err instanceof Error ? err.message : String(err)}` });
    }
  },
};
