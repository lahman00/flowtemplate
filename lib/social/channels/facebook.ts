import type { ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat, envAll, missingEnvNames } from "@/lib/social/channels/types";

/**
 * Facebook Page adapter — ported from Need Go Home's real, working
 * publishers/facebook.py (Graph API):
 *   1. POST /{page-id}/feed with message + access_token (pages_manage_posts)
 *      -> { "id": "<pageid>_<storyid>" }
 *   2. GET /{post-id}?fields=id,permalink_url (read-back verification —
 *      the permalink_url is the canonical live post URL).
 * A Page Access Token never expires, so this runs unattended after
 * one-time setup. The token travels in the request body (form-encoded),
 * never the URL, so it can't leak through a request line or access log.
 */

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const CHAR_LIMIT = 2000; // Facebook allows far more; keep posts short and readable.
const REQUIRED_ENV = ["SOCIAL_FACEBOOK_PAGE_ID", "SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN"];

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
    const env = envAll(REQUIRED_ENV);

    if (!env) {
      return buildPublishResult({ channel: "facebook", status: "SETUP_REQUIRED", text: body, link, error: `missing env: ${missingEnvNames(REQUIRED_ENV).join(", ")}` });
    }
    if (dryRun) {
      return buildPublishResult({ channel: "facebook", status: "DRY_RUN", text: body, link });
    }

    const pageId = env.SOCIAL_FACEBOOK_PAGE_ID;
    const token = env.SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN;

    try {
      const createRes = await fetch(`${GRAPH_BASE}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ message: body, access_token: token }),
      });
      if (createRes.status === 429) {
        return buildPublishResult({ channel: "facebook", status: "RATE_LIMITED", text: body, link, error: "rate limited (HTTP 429)" });
      }
      if (createRes.status === 401 || createRes.status === 403) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, error: `auth failed HTTP ${createRes.status}` });
      }
      if (!createRes.ok) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, error: `HTTP ${createRes.status}` });
      }
      const created = (await createRes.json()) as { id?: string };
      if (!created.id) {
        return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, error: "no post id in Graph response" });
      }

      let postUrl: string | null = null;
      let verified = false;
      try {
        const infoRes = await fetch(`${GRAPH_BASE}/${created.id}?fields=id,permalink_url&access_token=${encodeURIComponent(token)}`);
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
      if (!postUrl) postUrl = `https://www.facebook.com/${created.id}`;

      return buildPublishResult({ channel: "facebook", status: "PUBLISHED", text: body, link, postUrl, postId: created.id, verified });
    } catch (err) {
      return buildPublishResult({ channel: "facebook", status: "FAILED", text: body, link, error: `${err instanceof Error ? err.constructor.name : "Error"}: ${err instanceof Error ? err.message : String(err)}` });
    }
  },
};
