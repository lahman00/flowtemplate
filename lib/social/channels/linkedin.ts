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
const REQUIRED_ENV = ["SOCIAL_LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_ORGANIZATION_ID", "SOCIAL_LINKEDIN_VERSION"];

export const linkedinAdapter: SocialAdapter = {
  channel: "linkedin",
  requiredEnv: REQUIRED_ENV,
  charLimit: CHAR_LIMIT,
  isConfigured: () => envAll(REQUIRED_ENV) !== null,
  missingEnv: () => missingEnvNames(REQUIRED_ENV),
  format: (text, link) => defaultFormat(text, link, CHAR_LIMIT),

  async publish(variant: ChannelVariant, options): Promise<PublishResult> {
    const body = defaultFormat(variant.text, variant.link, CHAR_LIMIT);
    if (options.dryRun) return buildPublishResult({ channel: "linkedin", status: "DRY_RUN", text: body, link: variant.link ?? "" });
    if (!envAll(REQUIRED_ENV)) return buildPublishResult({ channel: "linkedin", status: "SETUP_REQUIRED", text: body, link: variant.link ?? "", error: `Missing ${missingEnvNames(REQUIRED_ENV).join(", ")} and/or LinkedIn Community Management API access (w_organization_social).` });
    try {
      const response = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN!}`, "Content-Type": "application/json", "Linkedin-Version": process.env.SOCIAL_LINKEDIN_VERSION!, "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({ author: `urn:li:organization:${process.env.SOCIAL_LINKEDIN_ORGANIZATION_ID!}`, commentary: body, visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        return buildPublishResult({ channel: "linkedin", status: response.status === 429 ? "RATE_LIMITED" : "FAILED", text: body, link: variant.link ?? "", error: `LinkedIn Posts API HTTP ${response.status}: ${detail}` });
      }
      const postId = response.headers.get("x-restli-id");
      if (!postId) return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", error: "LinkedIn returned success without x-restli-id; publication identity is unknown, so automatic retry is withheld." });
      return buildPublishResult({ channel: "linkedin", status: "PUBLISHED", text: body, link: variant.link ?? "", postId, verified: false });
    } catch (error) {
      return buildPublishResult({ channel: "linkedin", status: "FAILED", text: body, link: variant.link ?? "", error: `LinkedIn request failed with unknown publication outcome; inspect the Page before retrying: ${error instanceof Error ? error.message : String(error)}` });
    }
  },
};
