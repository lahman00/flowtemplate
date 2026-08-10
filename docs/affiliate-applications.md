# Affiliate applications — Tier A

This is a checklist, not a status report: every "Approval status" field
below reads **Not yet applied** because no application has actually been
submitted. Nothing on this page is a claim that any program has approved
Miloosh — see `docs/revenue.md` for the tier ranking and
`data/revenue/affiliate-programs.ts` for the full research this is built
on.

Originally written at Sprint 9 (34-product dataset, 6 confirmed Tier A
programs). The catalog has since grown to 217 products, and revenue
re-tiering now puts all 15 products with a confirmed affiliate program
(`programExists: "yes"`) into Tier A — items 7-14 below were added in an
autonomous session on 2026-08-10 using the research already on record in
`data/revenue/affiliate-programs.ts` (no new fetches were needed; that
research was already sourced and dated 2026-07-31).

Only programs `data/revenue/affiliate-programs.ts` marks
`programExists: "yes"` are listed — Sprint 9's rule is to use only
confirmed official programs, and that's enforced in code too:
`lib/revenue/affiliate-activation.ts` silently ignores any credential set
for a product without a confirmed program, even if one is supplied.

**A general caveat that applies to every row below**: the "Required
account" and "Required website details" fields describe what that
affiliate network *generally* asks of applicants (based on how
PartnerStack/Impact-style programs are commonly structured), not fields
independently confirmed on each vendor's actual signup form — the Phase 1
research fetched each program's terms/overview page, not the application
form itself. Confirm the live form's exact required fields at application
time.

## 1. ClickUp

- **Official application page**: https://clickup.com/partners/affiliates
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account (created during signup at the link above).
- **Required website details**: Typically your site's URL and a description of how you'll promote ClickUp — not independently confirmed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_CLICKUP` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_CLICKUP` once you have one)_
- **Notes**: $25 per free-workspace signup plus 20% commission on paid conversions within a 180-day window (commission recurrence beyond first payment not stated). Some countries aren't commissionable — contact affiliates@clickup.com per the official page. 30-day cookie.

## 2. Asana

- **Official application page**: https://asana.com/partners/referral
- **Network**: Not named on the fetched pages (unknown)
- **Required account**: Requires an active **paid** Asana subscription to apply — this is stated explicitly on Asana's own partner-program terms.
- **Required website details**: Not disclosed on the official pages fetched; the Partner Program Guide referenced in the terms isn't public.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_ASANA` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_ASANA` once you have one)_
- **Notes**: Three-tier program (Solutions/Services/Referral Partners). Official terms explicitly defer commission specifics to a non-public guide, and prohibit use in U.S.-embargoed countries/regions. The "requires a paid subscription to apply" condition is worth flagging early — it's a real prerequisite, not just paperwork.

## 3. Notion

- **Official application page**: https://www.notion.com/affiliates
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied — **and currently not applicable**: the official page shows "Program is currently not accepting new affiliates" as of the Phase 1 research date (2026-07-31). Re-check the page before attempting to apply.
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_NOTION` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_NOTION` once you have one)_
- **Notes**: Up to $50 per activated sign-up plus 20% of year-one revenue, for upgrades within 180 days of a link click, when the program is open. Self-referrals are explicitly prohibited; FTC disclosure is required.

## 4. Monday.com

- **Official application page**: https://monday.com/affiliate-program/
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page; the program is described as free to join.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_MONDAY` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_MONDAY` once you have one)_
- **Notes**: Up to 100% commission on a referred customer's first-year sales (tiered; exact breakdown not shown on the fetched page). Monthly payouts via PayPal or Stripe.

## 5. HubSpot

- **Official application page**: https://www.hubspot.com/partners/affiliates
- **Network**: Impact
- **Required account**: An Impact.com publisher/partner account (managed through Impact's own platform, linked from HubSpot's page).
- **Required website details**: Not disclosed on HubSpot's own page; full requirements likely live inside Impact's application flow.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_HUBSPOT` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_HUBSPOT` once you have one)_
- **Notes**: 30% recurring commission per successful referral (up to $1,000+ per sale), tiered by monthly signup volume, up to 1 year for the entry tier. 180-day cookie window. Full commission tables live inside Impact's own tooling, not HubSpot's public page.

## 6. Pipedrive

- **Official application page**: https://www.pipedrive.com/en/affiliate-partnership
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page. Note: the page states international promotion is generally allowed with a few unnamed geographic exceptions communicated during approval.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_PIPEDRIVE` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_PIPEDRIVE` once you have one)_
- **Notes**: Three tiers — Rising (20% revenue share, first 12 months), Growth (30%, first 12 months), Power (custom, top performers). $5 minimum withdrawal; commissions locked two months after the transaction, paid on the 13th.

## 7. Cal.com

- **Official application page**: https://cal.com/affiliate-program
- **Network**: Direct (run through Cal.com's own referral system at app.cal.com/refer, not a third-party network).
- **Required account**: A Cal.com account; the terms page indicates participation requires approval.
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_CAL_COM` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_CAL_COM` once you have one)_
- **Notes**: 20% commission for a full year; referred customers get 20% off for 12 months. The separate legal terms page describes payouts only as generic "Rewards... as determined by Cal.com."

## 8. n8n

- **Official application page**: https://n8n.io/affiliates/
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_N8N` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_N8N` once you have one)_
- **Notes**: 30% commission on all n8n Cloud referrals for 12 months, based on n8n's net earnings per subscription. Monthly PayPal payouts, EUR 100 minimum payout; paid ad campaigns are explicitly prohibited for affiliates.

## 9. Todoist

- **Official application page**: https://www.todoist.com/channelpartners
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account (via market.partnerstack.com/program/doist).
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_TODOIST` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_TODOIST` once you have one)_
- **Notes**: Three sub-programs (Ambassadors/Affiliates/Resellers). Up to 25% commission per sale (yearly plans: one-time; monthly plans: up to 12 payments), accruing only after 30 days of active subscription. 90-day cookie. Only purchases made directly on todoist.com qualify — App Store/Google Play purchases are excluded. $25 minimum payout.

## 10. Airtable

- **Official application page**: https://www.airtable.com/partners (program terms: https://www.airtable.com/company/affiliate-terms)
- **Network**: PartnerStack (airtable.partnerstack.com)
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_AIRTABLE` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_AIRTABLE` once you have one)_
- **Notes**: 20% commission on Plus/Pro plans, for the lifetime of the account (90-day cookie). A separate $10-credit user-referral program also exists (different from the affiliate program).

## 11. Miro

- **Official application page**: https://miro.com/affiliates/join-our-program/
- **Network**: PartnerStack
- **Required account**: A PartnerStack partner account.
- **Required website details**: Not disclosed beyond the program overview page.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_MIRO` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_MIRO` once you have one)_
- **Notes**: Two distinct programs — a content-creator affiliate program (PartnerStack, paying $10-$40 per corporate-email free-trial sign-up, GEO-dependent) and a separate customer-to-customer referral program (up to $500 per successful referral). 30-day cookie; payout 20 days after lock-in.

## 12. Lucidchart

- **Official application page**: https://ui.awin.com/merchant-profile/52579 (Lucid's own /partners page at lucid.co/partners only covers B2B/reseller partnerships, not this affiliate program)
- **Network**: Awin
- **Required account**: An Awin publisher account.
- **Required website details**: Standard Awin publisher-application details — not independently confirmed on Lucid's own pages.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_LUCIDCHART` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_LUCIDCHART` once you have one)_
- **Notes**: 5% sale commission plus an unspecified bonus payout program, per Awin's own merchant page. Other third-party aggregator sites cite different, higher figures that conflict with Awin's page — Awin's figure is treated as authoritative here since it's the program's actual operator.

## 13. Doodle

- **Official application page**: https://doodle.com/en/partners/
- **Network**: Direct (no third-party network named on the official page).
- **Required account**: Not disclosed on the official page.
- **Required website details**: Not disclosed on the official page.
- **Approval status**: Not yet applied — **and time-sensitive**: the official page states this program is confirmed closing on **2026-04-30**. Verify it is still open before applying; if that date has passed, remove this entry.
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_DOODLE` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_DOODLE` once you have one)_
- **Notes**: The official page states affiliates "earn commission for every new user you bring to Doodle" and that Doodle "can work with you on custom arrangements," but discloses no specific rate. Bidding on Doodle's brand terms in PPC is explicitly disallowed.

## 14. Canva

- **Official application page**: Unconfirmed — see caveat below.
- **Network**: "Impact" (unconfirmed)
- **Required account**: Unknown.
- **Required website details**: Unknown.
- **Approval status**: Not yet applied
- **Affiliate ID**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_ID_CANVA` once you have one)_
- **Affiliate URL**: _(not yet issued — set via `NEXT_PUBLIC_AFFILIATE_URL_CANVA` once you have one)_
- **Notes**: **Low confidence, listed for completeness only.** Canva's official Help Center affiliate pages returned 403 Forbidden on every research fetch attempt, so the network name and program existence come from third-party sources, not a directly-verified Canva page. Multiple third-party sources agree access now runs through applying to Canva's "Canvassador" program first — start there (canva.com/canvassador) and verify the actual affiliate terms during that application rather than trusting this entry's network/commission claims.

## Activating an approved link

Once (and only once) a real application above is actually approved and the
network has issued a real, working tracking link:

1. Update this file's "Approval status," "Affiliate ID," and "Affiliate
   URL" fields for that product with the real values, for our own record.
2. Set the corresponding env vars (`NEXT_PUBLIC_AFFILIATE_URL_<SLUG>` and,
   if issued separately, `NEXT_PUBLIC_AFFILIATE_ID_<SLUG>`) on the actual
   hosting environment — or add the same values to a local, gitignored
   `config/affiliate-credentials.json` (copy the shape from
   `config/affiliate-credentials.example.json`).
3. Nothing else changes — no code, no redeploy of application logic.
   `lib/revenue/affiliate-activation.ts` picks up the new value
   automatically, `lib/affiliate.ts` starts resolving that product's CTA to
   the real affiliate URL, and the disclosure note under the button
   switches on because it's driven by the same activation state.
4. Verify the link actually works (opens the correct vendor page, tracking
   parameter intact) before considering it live.

Until step 2 happens for a given product, its CTA keeps resolving to the
plain official site — see `lib/affiliate.ts`.
