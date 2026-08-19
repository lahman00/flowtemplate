import { createHmac } from "node:crypto";
import type { ChannelVariant, PublishResult } from "@/lib/social/types";
import { type SocialAdapter, buildPublishResult, defaultFormat, envAll, missingEnvNames } from "@/lib/social/channels/types";

/**
 * LinkedIn Company Page adapter. It fails closed until the production
 * environment has both approved API access and the required credentials.
 *
 * Real research (2026-08-16, directly fetched from learn.microsoft.com/
 * linkedin, re-verified 2026-08-19): posting to a LinkedIn COMPANY PAGE
 * requires the Community Management API (w_organization_social scope,
 * /rest/posts, organization URN as author, Linkedin-Version header) —
 * gated behind LinkedIn's formal partner-application process: legal-
 * entity verification, a Page-admin app-association check, a Development
 * Tier review, then a Standard Tier review requiring a narrated
 * screencast of the working OAuth flow. LinkedIn explicitly reserves the
 * right to decline qualified applicants and publishes no guaranteed
 * review timeline or self-serve fee.
 *
 * 2026-08-19 update: current third-party integrator guides report the
 * partner program may now be closed to NEW applicants entirely ("if you
 * weren't already a partner when applications closed, you can't apply")
 * — not independently confirmed against LinkedIn's own docs, which don't
 * state this directly, but it's consistent with the access-request-form
 * + review language LinkedIn's own docs do show. Treat as: this may be
 * harder than "apply and wait," not easier — verify current status
 * directly with LinkedIn before assuming the partner path is even open.
 *
 * The only self-serve, no-approval LinkedIn product ("Share on
 * LinkedIn", w_member_social) posts to a PERSONAL profile, not a company
 * page — not a fit for Miloosh's brand page.
 *
 * The implementation is ready for POST /rest/posts, but production has
 * no LinkedIn credentials today. SETUP_REQUIRED is therefore the only
 * live outcome until the external access gate is completed.
 */

const CHAR_LIMIT = 3000;
const DIRECT_ENV = ["SOCIAL_LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_ORGANIZATION_ID", "SOCIAL_LINKEDIN_VERSION"];
const MAKE_ENV = ["MAKE_LINKEDIN_WEBHOOK_URL", "MAKE_LINKEDIN_WEBHOOK_SECRET"];
const ORGANIZATION_ID = "141163964";
const ORGANIZATION_URN = `urn:li:organization:${ORGANIZATION_ID}`;

export type LinkedInTransport = "direct" | "make";

export function getLinkedInTransport(): LinkedInTransport {
  return process.env.LINKEDIN_TRANSPORT === "make" ? "make" : "direct";
}

function requiredEnv(): string[] {
  return getLinkedInTransport() === "make" ? MAKE_ENV : DIRECT_ENV;
}

async function publishViaMake(variant: ChannelVariant, body: string, options: { entryId?: string; scheduledAt?: string | null }): Promise<PublishResult> {
  const env = envAll(MAKE_ENV);
  if (!env || !options.entryId) return buildPublishResult({ channel: "linkedin", status: "SETUP_REQUIRED", text: body, link: variant.link ?? "", transport: "make", error: `Missing ${[...missingEnvNames(MAKE_ENV), ...(!options.entryId ? ["stable queue entry ID"] : [])].join(", ")}.` });
  const payload = JSON.stringify({ postId: options.entryId, idempotencyKey: `linkedin:${options.entryId}`, text: body, url: variant.link, scheduledAt: options.scheduledAt ?? null, organizationId: ORGANIZATION_ID, organizationUrn: ORGANIZATION_URN });
  const timestamp = Date.now().toString();
  const signature = `sha256=${createHmac("sha256", env.MAKE_LINKEDIN_WEBHOOK_SECRET!).update(`${timestamp}.${payload}`).digest("hex")}`;
  try {
    const response = await fetch(env.MAKE_LINKEDIN_WEBHOOK_URL!, { method: "POST", headers: { Authorization: `Bearer ${env.MAKE_LINKEDIN_WEBHOOK_SECRET}`, "Content-Type": "application/json", "X-Miloosh-Timestamp": timestamp, "X-Miloosh-Signature": signature, "Idempotency-Key": `linkedin:${options.entryId}` }, body: payload, signal: AbortSignal.timeout(20_000) });
    const raw = (await response.text()).slice(0, 2_000);
    if (!response.ok) return buildPublishResult({ channel: "linkedin", status: response.status === 429 ? "RATE_LIMITED" : "FAILED", text: body, link: variant.link ?? "", transport: "make", error: `Make webhook HTTP ${response.status}: ${raw}` });
    let result: { status?: string; executionId?: string; linkedinPostId?: string; linkedinPostUrl?: string; error?: string } = {};
    try { result = raw ? JSON.parse(raw) : {}; } catch { /* A 2xx without a definitive JSON result is acceptance only. */ }
    if (result.status === "published" && result.linkedinPostId) return buildPublishResult({ channel: "linkedin", status: "PUBLISHED", text: body, link: variant.link ?? "", transport: "make", executionId: result.executionId, postId: result.linkedinPostId, postUrl: result.linkedinPostUrl ?? null, verified: true });
    if (result.status === "failed") return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", transport: "make", executionId: result.executionId, error: result.error || "Make reported a definite LinkedIn module failure." });
    return buildPublishResult({ channel: "linkedin", status: "PENDING_CONFIRMATION", text: body, link: variant.link ?? "", transport: "make", executionId: result.executionId, error: "Make accepted the request but did not return a definitive LinkedIn post ID; awaiting authenticated reconciliation." });
  } catch (error) {
    return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", transport: "make", error: `Make request failed with unknown publication outcome: ${error instanceof Error ? error.message : String(error)}` });
  }
}

async function publishDirect(variant: ChannelVariant, body: string): Promise<PublishResult> {
  if (!envAll(DIRECT_ENV)) return buildPublishResult({ channel: "linkedin", status: "SETUP_REQUIRED", text: body, link: variant.link ?? "", transport: "direct", error: `Missing ${missingEnvNames(DIRECT_ENV).join(", ")} and/or LinkedIn Community Management API access (w_organization_social).` });
  try {
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN!}`, "Content-Type": "application/json", "Linkedin-Version": process.env.SOCIAL_LINKEDIN_VERSION!, "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({ author: `urn:li:organization:${process.env.SOCIAL_LINKEDIN_ORGANIZATION_ID!}`, commentary: body, visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      return buildPublishResult({ channel: "linkedin", status: response.status === 429 ? "RATE_LIMITED" : "FAILED", text: body, link: variant.link ?? "", transport: "direct", error: `LinkedIn Posts API HTTP ${response.status}: ${detail}` });
    }
    const postId = response.headers.get("x-restli-id");
    if (!postId) return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", transport: "direct", error: "LinkedIn returned success without x-restli-id; publication identity is unknown, so automatic retry is withheld." });
    return buildPublishResult({ channel: "linkedin", status: "PUBLISHED", text: body, link: variant.link ?? "", transport: "direct", postId, verified: false });
  } catch (error) {
    return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", transport: "direct", error: `LinkedIn request failed with unknown publication outcome; inspect the Page before retrying: ${error instanceof Error ? error.message : String(error)}` });
  }
}

export const linkedinAdapter: SocialAdapter = {
  channel: "linkedin",
  requiredEnv: [...DIRECT_ENV, ...MAKE_ENV, "LINKEDIN_TRANSPORT"],
  charLimit: CHAR_LIMIT,
  isConfigured: () => envAll(requiredEnv()) !== null,
  missingEnv: () => missingEnvNames(requiredEnv()),
  format: (text, link) => defaultFormat(text, link, CHAR_LIMIT),

  async publish(variant: ChannelVariant, options): Promise<PublishResult> {
    const body = defaultFormat(variant.text, variant.link, CHAR_LIMIT);
    const transport = getLinkedInTransport();
    if (options.dryRun) return buildPublishResult({ channel: "linkedin", status: "DRY_RUN", text: body, link: variant.link ?? "", transport });
    return transport === "make" ? publishViaMake(variant, body, options) : publishDirect(variant, body);
  },
};
