# Affiliate revenue map — verified state

Updated: 2026-08-19

This is the compact operational map. The field-complete 34-company evidence ledger is `data/affiliate/partner-materials-audit.ts`; its human-readable findings and priority rationale are in `data/affiliate/PARTNER_MATERIALS_AUDIT_2026-08-19.md`.

## Canonical active registry

Corrected 2026-08-19: Brevo removed (rejected — see Current program state below). Was 12 rows/11 revenue-ready with 1 blocked; now 11 rows, all revenue-ready, none blocked.

| Partner | Affiliate URL | Software route | Comparisons | Revenue ready | Blocker |
|---|---:|---|---:|---:|---|
| Constant Contact | Yes | `/software/constant-contact` | 12 | Yes | — |
| Todoist | Yes | `/software/todoist` | 15 | Yes | — |
| Moosend | Yes | `/software/moosend` | 6 | Yes | — |
| Volza | Yes | `/software/volza` | 2 | Yes | — |
| Pipedrive | Yes | `/software/pipedrive` | 8 | Yes | — |
| GetResponse | Yes | `/software/getresponse` | 13 | Yes | — |
| Airtable | Yes | `/software/airtable` | 11 | Yes | — |
| monday.com | Yes | `/software/monday` | 11 | Yes | — |
| WhatConverts | Yes | `/software/whatconverts` | 2 | Yes | — |
| ElevenLabs | Yes | `/software/elevenlabs` | 11 | Yes | — |
| KrispCall | Yes | `/software/krispcall` | 1 | Yes | — |

All 11 linked partners use the canonical registry, tracked CTAs, affiliate disclosure, and `rel="sponsored noopener noreferrer"`. Brevo now falls back to its official site with no affiliate disclosure, the same path any never-registered partner uses — not a special case anymore.

## Other verified live integrations

- Shopify — Impact URL recorded in `data/software/shopify.json`.
- Wix — Impact funnel URLs recorded in its software data and Wix funnel resolver.

## Current program state

- **Brevo — REJECTED, corrected in code 2026-08-19:** the PartnerStack program page's own **Messages** tab (same account, same "BREVO" program instance that shows Active at the top level) contains two first-party messages from Brevo: "Your application to become a Brevo affiliate is under review" (dated Yesterday) followed by **"Your application was not approved... your application has been removed from our onboarding process"** (dated Today). This is a genuine rejection, on this exact program, this exact account — not a different/direct Brevo program, not an earlier account. It fully explains the missing Offer/referral link found in the earlier check (Summary page had no "Offers" section, Resources was empty, Program settings had no link/terms). PartnerStack's top-level "Active" badge is stale/inconsistent with this per-application outcome — a platform-side display lag, not evidence of a real active relationship. Brevo has disabled PartnerStack's Messages reply feature, so no in-thread response is possible; any follow-up must go through PartnerStack Support (support.partnerstack.com) or Brevo's own channels. **Now corrected everywhere**: `active-partners.ts` (removed from the registry), `partner-materials-audit.ts` (reclassified `REJECTED`), and the production affiliate pipeline (`setPipelineStatus` → `rejected`, full audit trail preserved).
- **Miro — HOLD / UNCLEAR, corrected in code 2026-08-19:** searched both the Partnerships and Invitations tabs of the connected PartnerStack account (hello@miloosh.com) — no result in either; no partnership or invitation exists. Cross-checked against the real production affiliate pipeline (`npx tsx scripts/affiliate/audit.ts` against the live Blob store, not the stale local `var/agents/affiliate-pipeline.json` mirror): the pipeline **had** shown `status: "approved"` for Miro, but its own history reveals why that wasn't trustworthy — on 2026-08-14 an agent logged "No existing PartnerStack session available... requires the owner to log into their PartnerStack account and click Join," then under a second later the status jumped through `application_in_progress` → `submitted` → `pending_review` → `approved`, each entry annotated only "Fast-tracked: real-world approval already happened outside this pipeline's tracked flow" with no cited evidence (no screenshot, no email, no dashboard reference). A 2026-08-17 correction in the same record admits the `affiliateUrl` that had briefly been attached was "a copy-paste error from the monday.com pipeline entry, not a real Miro affiliate link." Miro's public affiliate program is confirmed PartnerStack-hosted (`market.partnerstack.com/page/miroaffiliate`), publicly stating $10–$40 per qualified corporate trial signup by geography — a public program claim, not verified against any Miloosh account. **Now corrected everywhere**: `partner-materials-audit.ts` (reclassified `HOLD / UNCLEAR`) and the production affiliate pipeline (`setPipelineStatus` → `needs_owner_action`, with the exact confirmation needed from Eyal recorded as the reason). No application was submitted (out of scope).
- **Pending:** FreshBooks, ActiveCampaign, Close, ClickUp, Kit, Wrike, Zendesk.
- **Rejected:** HubSpot, n8n.
- **Hold / unclear:** Iconosquare, Carepatron, Ruby, MindStudio, 8fig, Pagecloud, RocketReach, Flatpay, Hubstaff, Closely.

## Priority policy

No current traffic contribution was found in the collected materials, so traffic is `UNKNOWN` and no numeric demand or revenue estimate is asserted. Current operational priority is:

1. Revenue-ready programs with strong commercial route coverage: Pipedrive, GetResponse, Todoist, Constant Contact, Moosend.
2. Other revenue-ready canonical/Impact partners.
3. Brevo and Miro after legitimate personalized URLs and status evidence are reconciled.
4. Pending applications after approval.
5. Hold/rejected records receive no implementation work.

No CTA or public-page change is authorized by this document.
