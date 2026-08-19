# Affiliate revenue map — verified state

Updated: 2026-08-19

This is the compact operational map. The field-complete 34-company evidence ledger is `data/affiliate/partner-materials-audit.ts`; its human-readable findings and priority rationale are in `data/affiliate/PARTNER_MATERIALS_AUDIT_2026-08-19.md`.

## Canonical active registry

| Partner | Affiliate URL | Software route | Comparisons | Revenue ready | Blocker |
|---|---:|---|---:|---:|---|
| Constant Contact | Yes | `/software/constant-contact` | 12 | Yes | — |
| Todoist | Yes | `/software/todoist` | 15 | Yes | — |
| Moosend | Yes | `/software/moosend` | 6 | Yes | — |
| Volza | Yes | `/software/volza` | 2 | Yes | — |
| Brevo | No | `/software/brevo` | 11 | No | Personalized affiliate URL required |
| Pipedrive | Yes | `/software/pipedrive` | 8 | Yes | — |
| GetResponse | Yes | `/software/getresponse` | 13 | Yes | — |
| Airtable | Yes | `/software/airtable` | 11 | Yes | — |
| monday.com | Yes | `/software/monday` | 11 | Yes | — |
| WhatConverts | Yes | `/software/whatconverts` | 2 | Yes | — |
| ElevenLabs | Yes | `/software/elevenlabs` | 11 | Yes | — |
| KrispCall | Yes | `/software/krispcall` | 1 | Yes | — |

All 11 linked partners use the canonical registry, tracked CTAs, affiliate disclosure, and `rel="sponsored noopener noreferrer"`. Brevo falls back to its official site without affiliate disclosure until a legitimate URL is supplied.

## Other verified live integrations

- Shopify — Impact URL recorded in `data/software/shopify.json`.
- Wix — Impact funnel URLs recorded in its software data and Wix funnel resolver.

## Current program state

- **Approved but needs link:** Brevo; Miro is also recorded approved/missing-link in the production affiliate pipeline but is not yet in the canonical active registry.
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
