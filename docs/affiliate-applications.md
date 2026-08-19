# Affiliate applications — live status + acquisition queue

Updated: 2026-08-19

This file is the operational affiliate list for Miloosh across PartnerStack accounts and direct networks. Statuses below distinguish **ACTIVE**, **PENDING**, **KNOWN REJECTED**, and **MONITORING TARGETS**. Never mark a program active until a real tracking URL has been issued and verified.

## PartnerStack Account #1 (hello@miloosh.com)

| Program | Network | Status | Commission / Evidence | Next Action |
|---|---|---|---|---|
| Airtable | PartnerStack | ACTIVE | 20% recurring | Link active in Miloosh (`https://airtable.partnerlinks.io/b0dz88v48tek`) |
| Constant Contact | PartnerStack | ACTIVE (Approved) | Commission terms not re-verified in today's collected materials | Link active in canonical registry |
| Todoist | PartnerStack | ACTIVE (Approved) | Up to 25%; yearly one-time/monthly up to 12 payments | Link active in canonical registry |
| Moosend | PartnerStack | ACTIVE (Approved) | 30–40% recurring | Link active in canonical registry |
| Volza | PartnerStack | ACTIVE (Approved) | 20–30% revenue share (program wording) | Link active in canonical registry |
| Brevo | PartnerStack | ACTIVE (Approved) | Commission terms UNKNOWN in collected materials | Copy personalized tracking URL from dashboard |
| Pipedrive | PartnerStack | ACTIVE (Approved) | 20%/30% revenue share for first 12 months; Power custom | Link active in canonical registry |
| GetResponse | PartnerStack | ACTIVE (Approved) | 40%/50%/60% for 12 months by tier | Link active in canonical registry |
| KrispCall | PartnerStack | ACTIVE (Approved) | Commission terms UNKNOWN in collected materials | Link active in canonical registry |
| FreshBooks | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| ActiveCampaign | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Close | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| ClickUp | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Kit | PartnerStack | PENDING | Application under review | Wait; do not reapply |

## PartnerStack Account #2 (Preserve / Do Not Modify)

| Program | Network | Status | Commission / Evidence | Next Action |
|---|---|---|---|---|
| monday.com | PartnerStack | ACTIVE | $10+ per signup / rev share | Link active in Miloosh (`https://try.monday.com/1p2fpizulcj7`) |
| WhatConverts | PartnerStack | ACTIVE | 20% recurring for 2 years | Link active in Miloosh (`https://partners.whatconverts.com/bmckzlf0vnl8`) |
| ElevenLabs | PartnerStack | ACTIVE | 22% for first 12 months | Link active in Miloosh (`https://try.elevenlabs.io/gkp73pehjgtl`) |
| Wrike | PartnerStack | PENDING | Application under review | Wait; do not reapply |
| Zendesk | PartnerStack | PENDING | Application under review | Wait; do not reapply |

## Non-PartnerStack / Direct Programs

| Program | Network | Status | Notes |
|---|---|---|---|
| Shopify | Impact | ACTIVE | Real Impact tracking URL recorded (`https://shopify.pxf.io/L0EG9O`) |
| Wix | Impact | ACTIVE | Multi-funnel Impact routing (`https://wix.pxf.io/c/7623171/2096727/25616`) |

## Known Rejected / Not Pending

- **HubSpot**: Rejected by vendor affiliate program. Do NOT treat as pending or reapply.
- **n8n**: Rejected by vendor affiliate program. Do NOT treat as pending or reapply.

## Activation Rule

Only after a program is approved and a real tracking URL is issued:
1. Record the exact approval status and tracking URL in Miloosh.
2. Set the corresponding affiliate URL in `.env.local` (`NEXT_PUBLIC_AFFILIATE_URL_<SLUG>`) or `config/affiliate-credentials.json`.
3. Verify the tracking URL opens the correct vendor destination and preserves attribution.
4. Only then allow Miloosh CTAs to use it and show the affiliate disclosure.
