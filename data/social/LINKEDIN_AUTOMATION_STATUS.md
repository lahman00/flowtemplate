# LinkedIn Automation Architecture — Status

Re-verified 2026-08-19 against current sources (learn.microsoft.com/linkedin, cross-checked with current third-party integrator guides — not relying on the 2026-08-16 research alone).

## Architecture — already correct, not rebuilt

Facebook's adapter proves the pattern (queue, scheduling, QA gates, dedup, UTM, publish verification, error classification, analytics hooks — all in `lib/social/`). LinkedIn already has its own adapter at the same interface (`lib/social/channels/linkedin.ts`, implementing `SocialAdapter`), registered in `lib/social/channels/registry.ts` alongside Facebook/Bluesky/Mastodon. No second architecture was built or needed — this is genuinely "another adapter in the existing system," exactly as instructed.

## The exact blocker

Posting to a LinkedIn **company page** (not a personal profile) requires the **Community Management API**:

- Scope: `w_organization_social`
- Endpoint: `POST /rest/posts`, organization URN as author, `Linkedin-Version` header (YYYYMM format)
- **Access gate:** a formal partner-application process — legal-entity verification, a Page-admin app-association check, a Development Tier review, then a Standard Tier review requiring a narrated screencast of a working OAuth flow. No guaranteed timeline, no published fee, and LinkedIn explicitly reserves the right to decline qualified applicants.
- **2026-08-19 addition to the record:** current integrator guides report the partner program may be closed to new applicants entirely right now ("if you weren't already a partner when applications closed, you can't apply"). This isn't independently confirmed on LinkedIn's own docs pages, but it's consistent with what those pages do say, and it means the realistic expectation should be "may not be obtainable at all right now," not just "slow."

The only LinkedIn API with no approval gate — "Share on LinkedIn" (`w_member_social`) — posts to a **personal profile**, not a company page. Not usable for the Miloosh brand page regardless of approval status.

## What was implemented without fabricating credentials

- The adapter's `isConfigured()` always returns `false` and `missingEnv()` names the real blocker in plain language (not a generic "env var missing" message) — visible in the internal dashboard and QA reports.
- `publish()` returns a `MANUAL_ONLY` result with the fully-formatted, platform-native post text and link — same content the automated pipeline would send if the API were available, just requiring a human to paste it in.
- The content engine and QA gates treat LinkedIn identically to Facebook up to the publish step — a LinkedIn variant gets the same fact-checking, UTM tagging, and brand/visual QA as everything else. Only the final "click send" step is manual.

## The exact human step, if Eyal wants to pursue this

1. Go to LinkedIn's developer portal and locate the Community Management API access-request form (currently under `learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview`).
2. Submit the access request with real organization and use-case details — this agent cannot do this: it requires an authenticated LinkedIn developer account tied to Eyal's own identity/business, and legal-entity attestations only he can make.
3. If accepted into Development Tier, complete OAuth setup and the narrated Standard Tier review screencast.
4. Once approved, provide the resulting access token via the existing env var pattern (matching Facebook's `SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN` convention) — at that point, `linkedin.ts`'s `publish()` can be swapped for a real API call with no interface change anywhere else in the system.

**Recommendation:** given the "may be closed to new applicants" signal, don't block the rest of the social program on this. Keep publishing LinkedIn content manually (which already works fine — 2 real posts, real engagement) while this is pursued in parallel, if at all.
