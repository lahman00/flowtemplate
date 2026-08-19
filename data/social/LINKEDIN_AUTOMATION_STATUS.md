# LinkedIn Automation Architecture — Status

Re-verified 2026-08-19 against LinkedIn's current official Microsoft Learn documentation and the production Vercel environment.

## Architecture

LinkedIn uses the existing queue, scheduling, QA, UTM, retry, and provider-state pipeline. `LINKEDIN_TRANSPORT=direct` selects the official Posts API implementation; `LINKEDIN_TRANSPORT=make` selects a signed Make webhook bridge. Both transports share the same queue identity and provider state, so switching requires no editorial or queue migration.

## Make bridge status

The code path is ready, but production has no Make webhook URL, authentication secret, or transport selection yet. Make remains an external transport only: Miloosh sends the final publication-time UTM copy and stable `linkedin:{queueEntryId}` idempotency key. A synchronous response with a LinkedIn post ID becomes `PUBLISHED`; acceptance without that ID becomes `PENDING_CONFIRMATION`; ambiguous network results become `UNKNOWN_OUTCOME` and are not blindly retried.

If Make completes asynchronously, it calls `POST /api/social/make/linkedin-result` with the same queue identity. The callback requires bearer authentication, rejects unknown IDs, is idempotent, and only updates the LinkedIn channel.

## The exact blocker

Posting to a LinkedIn **company page** (not a personal profile) requires the **Community Management API**:

- Scope: `w_organization_social`
- Endpoint: `POST /rest/posts`, organization URN as author, `Linkedin-Version` header (YYYYMM format)
- **Access gate:** a formal partner-application process — legal-entity verification, a Page-admin app-association check, a Development Tier review, then a Standard Tier review requiring a narrated screencast of a working OAuth flow. No guaranteed timeline, no published fee, and LinkedIn explicitly reserves the right to decline qualified applicants.
The only LinkedIn API with no approval gate — "Share on LinkedIn" (`w_member_social`) — posts to a **personal profile**, not a company page. Not usable for the Miloosh brand page regardless of approval status.

Production inspection on 2026-08-19 found none of the required values: `SOCIAL_LINKEDIN_ACCESS_TOKEN`, `SOCIAL_LINKEDIN_ORGANIZATION_ID`, or `SOCIAL_LINKEDIN_VERSION`. Therefore no live LinkedIn API call was attempted.

## Ready code path

- Missing access returns `SETUP_REQUIRED`; it never fabricates a publication.
- Configured access sends the organization author URN, commentary, public distribution, lifecycle state, `Linkedin-Version`, and Rest.li protocol headers required by the official Posts API.
- A successful response must contain `x-restli-id`; otherwise it is not recorded as published.
- The version is an environment value because LinkedIn sunsets Marketing API versions.

## The exact human step, if Eyal wants to pursue this

1. Go to LinkedIn's developer portal and locate the Community Management API access-request form (currently under `learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview`).
2. Submit the access request with real organization and use-case details — this agent cannot do this: it requires an authenticated LinkedIn developer account tied to Eyal's own identity/business, and legal-entity attestations only he can make.
3. If accepted into Development Tier, complete OAuth setup and the narrated Standard Tier review screencast.
4. Once approved, set `SOCIAL_LINKEDIN_ACCESS_TOKEN`, `SOCIAL_LINKEDIN_ORGANIZATION_ID`, and a currently supported `SOCIAL_LINKEDIN_VERSION` in Vercel production. No code change is then required.

Until those values and the required scope exist, keep LinkedIn publishing manual. Facebook automation is independent and remains enabled.
