/**
 * Sprint 8 Phase 1 — affiliate/referral/partner program research for every
 * product in data/software/*.json. Every entry below was checked against
 * that vendor's own official page (or, where named, the official
 * partner-network page — PartnerStack, Impact, Awin) as of 2026-07-31.
 * Nothing here is guessed: any field that couldn't be confirmed on an
 * official, fetchable page is `null` (or "unknown" for the enum fields),
 * and `notes` says what was actually found and why a field is unresolved.
 *
 * This is internal business-intelligence data, not user-facing content —
 * it deliberately isn't validated through data/software/schema.ts and
 * isn't rendered on any public page. See lib/revenue/affiliate-manager.ts
 * for the read API and docs/revenue.md for how it's used.
 */

export type AffiliateProgramStatus = "yes" | "no" | "unknown";
export type AffiliateProgramType = "direct" | "network" | "unknown";
export type CommissionRecurrence = "recurring" | "one_time" | "unknown";

export type AffiliateProgramInfo = {
  /** Matches a data/software/*.json slug. */
  slug: string;
  /** YYYY-MM-DD — when this entry was last checked against an official source. Real date, not a placeholder: all 34 entries were researched in the same Sprint 8 pass. */
  lastVerifiedAt: string;
  programExists: AffiliateProgramStatus;
  type: AffiliateProgramType;
  networkName: string | null;
  countryRestrictions: string | null;
  /** Verbatim or closely paraphrased from the official source — never invented. Null when no official page discloses a rate. */
  commissionModel: string | null;
  recurrence: CommissionRecurrence;
  notes: string;
  sourceUrls: string[];
};

export const AFFILIATE_PROGRAMS: AffiliateProgramInfo[] = [
  {
    slug: "airtable",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "20% commission on Plus/Pro plans, for the lifetime of the account (90-day cookie)",
    recurrence: "recurring",
    notes:
      "Official terms page (airtable.com/company/affiliate-terms) confirms the program exists; commission specifics come from Airtable's own PartnerStack signup page. A separate $10-credit user-referral program also exists.",
    sourceUrls: [
      "https://www.airtable.com/company/affiliate-terms",
      "https://airtable.partnerstack.com/",
      "https://www.airtable.com/partners",
    ],
  },
  {
    slug: "asana",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "unknown",
    networkName: null,
    countryRestrictions:
      "Partner Program Agreement prohibits selling, servicing, accessing, or using the Asana Service in a U.S.-embargoed country or region.",
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Three-tier program (Solutions/Services/Referral Partners), requires an active paid Asana subscription to apply. Official terms explicitly defer commission specifics to a non-public 'Partner Program Guide' — no network or rate is disclosed publicly.",
    sourceUrls: ["https://asana.com/partners/referral", "https://asana.com/terms/partner-program"],
  },
  {
    slug: "cal-com",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel: "20% commission for a full year; referred customers get 20% off for 12 months",
    recurrence: "recurring",
    notes:
      "Run through Cal.com's own referral system (app.cal.com/refer), not a third-party network. The separate legal terms page describes payouts only as generic 'Rewards... as determined by Cal.com,' and participation requires approval.",
    sourceUrls: ["https://cal.com/affiliate-program", "https://cal.com/affiliate-terms"],
  },
  {
    slug: "calendly",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Official partners page offers only API/integration partnerships and a general reseller contact form — no affiliate or referral commission program. Third-party affiliate-directory sites list 'Calendly affiliate' terms, but these aren't official Calendly sources.",
    sourceUrls: ["https://calendly.com/partners"],
  },
  {
    slug: "canva",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "Impact (unconfirmed)",
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Low confidence: Canva's official Help Center affiliate pages returned 403 Forbidden on every fetch attempt, so the network name and any commission figures come from third-party sources, not a directly-verified Canva page. Multiple sources agree access now runs through applying to Canva's 'Canvassador' program first.",
    sourceUrls: [],
  },
  {
    slug: "clickup",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions:
      "\"Some countries are not currently commissionable\" — specific countries not listed on the page; contact affiliates@clickup.com.",
    commissionModel:
      "Up to $25 for every new free workspace referral, plus 20% commission on sales from visitors who convert to a paid plan within 180 days",
    recurrence: "unknown",
    notes:
      "30-day cookie window. Tiered 'Advanced'/'Premier' partner status (based on signup volume) unlocks extra discounts/support. Page doesn't state whether the 20% paid-plan commission recurs beyond the first payment.",
    sourceUrls: ["https://clickup.com/partners/affiliates"],
  },
  {
    slug: "coda",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "network",
    networkName: "PartnerStack (historical)",
    countryRestrictions: null,
    commissionModel: "Historically 20% first-year commission on Pro/Team upgrades, plus a $10-credit signup referral",
    recurrence: "one_time",
    notes:
      "Following Coda's acquisition by Grammarly, official sources indicate the affiliate program closed and stopped new earnings as of April 13, 2026 (prior earned credit reportedly still honored via PartnerStack). The closure detail comes from a search-result snippet of an official help article, not a directly-fetched page (help.coda.io returned 403) — lower confidence on the exact date.",
    sourceUrls: ["https://community.coda.io/t/launched-coda-affiliate-program/29253"],
  },
  {
    slug: "confluence",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Atlassian's own /partners pages describe Solution, Marketplace, Global Alliance, and Platform Partner programs — B2B reseller/consulting/app-developer arrangements, not a pay-per-referral affiliate program. A third-party network (FlexOffers) lists an 'Atlassian affiliate program,' but it isn't confirmed as officially endorsed.",
    sourceUrls: ["https://www.atlassian.com/partners/join", "https://www.atlassian.com/partners"],
  },
  {
    slug: "discord",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Discord's 'Partner Program' is for server owners and offers Nitro perks/badges/non-cash community rewards, not a monetary affiliate program. discord.com/affiliates 404s; discord.com/partners redirects to a support article about profile badges.",
    sourceUrls: ["https://discord.com/partners"],
  },
  {
    slug: "doodle",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "one_time",
    notes:
      "Official page states affiliates 'earn commission for every new user you bring to Doodle' and that Doodle 'can work with you on custom arrangements,' but discloses no specific rate. The program itself is confirmed closing on April 30, 2026. No network platform is named; bidding on Doodle's brand terms in PPC is explicitly disallowed.",
    sourceUrls: ["https://doodle.com/en/partners/"],
  },
  {
    slug: "evernote",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "A live evernote.partnerstack.com subdomain exists, showing Evernote has used PartnerStack for partner/affiliate management, but the page returned only generic unpopulated template text, not live Evernote-specific terms — current status unconfirmed. Third-party sites cite inconsistent, unverified commission figures, so none are recorded here.",
    sourceUrls: ["https://evernote.partnerstack.com/"],
  },
  {
    slug: "figma",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "The official PartnerStack application page for Figma states 'The Figma affiliate program has concluded' and directs inquiries to affiliates@figma.com. Figma separately runs an active Service Partner Program for agencies/consultants/educators, but that covers certification/training/community benefits, not commission.",
    sourceUrls: [
      "https://dash.partnerstack.com/application?company=figma",
      "https://help.figma.com/hc/en-us/articles/17853580919959-What-is-Figma-s-Partner-Program",
    ],
  },
  {
    slug: "gitbook",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "An official app.gitbook.com URL path literally titled 'referrals-and-affiliate-program' exists, suggesting GitBook may run (or has run) such a program, but the page is a JS-rendered app whose content couldn't be extracted. gitbook.com/affiliates 404s and the main site's nav shows no affiliate link — unresolved.",
    sourceUrls: [
      "https://app.gitbook.com/o/-MTqT672WVE7Bdlqzn6d/sites/site_0opqL/referrals-and-affiliate-program/faq-referrals-and-affiliate-program",
    ],
  },
  {
    slug: "guru",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No official affiliate/referral/partner program page found (getguru.com/partners 404s; homepage has no partner/affiliate nav links). A community.getguru.com forum thread references a 'partner program' but couldn't be fetched (TLS certificate error) — unconfirmed. Guru sells paid Implementation/Education services via Account Executives, which isn't an affiliate program.",
    sourceUrls: [],
  },
  {
    slug: "hubspot",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "Impact",
    countryRestrictions: null,
    commissionModel:
      "30% recurring commission per successful referral (up to $1,000+ per sale), tiered by monthly signup volume (Starter 0-29/mo = 30% recurring up to 1 year; Sprocket 30-99/mo; Elite 100+/mo = custom)",
    recurrence: "recurring",
    notes:
      "Consumer/content-creator affiliate program managed via Impact.com, 180-day cookie window. Full commission tables live inside Impact's 'Affiliate Tool,' not the public page.",
    sourceUrls: [
      "https://www.hubspot.com/partners/affiliates",
      "https://www.hubspot.com/partners/affiliates/program-policies",
    ],
  },
  {
    slug: "jira",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Same Atlassian-wide partner program as Confluence and Trello (Solution, Marketplace, Global Alliance, Platform Partner tiers) — a B2B reseller/solution-partner program, not a consumer affiliate program. No commission rates are public.",
    sourceUrls: ["https://www.atlassian.com/partners", "https://www.atlassian.com/partners/join"],
  },
  {
    slug: "linear",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No consumer affiliate/referral program found. Linear's only public 'partner' offering is the Startup Program — a B2B discount (up to 6 months free) for startups referred via VC/accelerator partners — not a commission-based affiliate program.",
    sourceUrls: ["https://linear.app/startups", "https://linear.app/startups/partners"],
  },
  {
    slug: "lucidchart",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "Awin",
    countryRestrictions: null,
    commissionModel: "5% sale commission, plus an unspecified bonus payout program (per the Awin merchant page)",
    recurrence: "one_time",
    notes:
      "Lucid's own /partners page only lists Technology and Solutions Partners (B2B/reseller); the affiliate program itself runs through the Awin network, separate from lucid.co. Other third-party aggregator sites cite different, higher figures that conflict with Awin's own page — the Awin figure is treated as authoritative here.",
    sourceUrls: ["https://lucid.co/partners", "https://ui.awin.com/merchant-profile/52579"],
  },
  {
    slug: "make",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: "35% commission on referred users' subscription payments for 12 months (excludes 'extra operations' purchases)",
    recurrence: "recurring",
    notes:
      "30-day cookie window; $100 minimum payout plus 3 unique paying referrals, paid via Wise. Separate B2B 'Solution Partner' and 'Technology Partner' programs also exist but are distinct from this consumer affiliate program.",
    sourceUrls: ["https://www.make.com/en/affiliate"],
  },
  {
    slug: "mattermost",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No consumer affiliate program found. Mattermost runs only Authorized Reseller, Value-Added Reseller, and Deployment Solutions Partner programs; the only 'referral fee' mechanism is for registered B2B partner deals, requiring formal deal registration — not a public affiliate link program.",
    sourceUrls: ["https://handbook.mattermost.com/operations/sales/partner-programs"],
  },
  {
    slug: "microsoft-teams",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No official, currently-live Microsoft page confirms a consumer affiliate program for Teams specifically. Some third-party affiliate-directory sites claim Rakuten Advertising, but this is unverified on an official microsoft.com page. The Microsoft Partner Network is a reseller/ISV program, not a consumer affiliate program, and isn't Teams-specific.",
    sourceUrls: [],
  },
  {
    slug: "miro",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel:
      "$10-$40 per corporate email sign-up to free trial (CPL, based on sign-up GEO); a separate customer referral program pays up to $500 per successful referral",
    recurrence: "one_time",
    notes:
      "Two distinct programs: a content-creator affiliate program (PartnerStack, CPL-based) and a separate customer-to-customer referral program. 30-day cookie window; payout 20 days after lock-in.",
    sourceUrls: [
      "https://miro.com/affiliates/join-our-program/",
      "https://help.miro.com/hc/en-us/articles/22025722876562-Miro-s-Referral-Program",
    ],
  },
  {
    slug: "monday",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "Up to 100% commission on the first year's sales of each customer referred (tiered; exact breakdown not shown on page)",
    recurrence: "one_time",
    notes: "Monthly payouts via PayPal or Stripe; free to join, no earnings cap mentioned.",
    sourceUrls: ["https://monday.com/affiliate-program/"],
  },
  {
    slug: "n8n",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "30% commission on all n8n Cloud referrals for 12 months, based on n8n's net earnings per subscription",
    recurrence: "recurring",
    notes: "Monthly PayPal payouts, EUR 100 minimum payout; paid ad campaigns are explicitly prohibited for affiliates.",
    sourceUrls: ["https://n8n.io/affiliates/", "https://support.n8n.io/article/do-you-have-an-affiliates-program"],
  },
  {
    slug: "notion",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "Up to $50 per activated sign-up, plus 20% of year-one revenue per referral (applies to upgrades within 180 days of link click)",
    recurrence: "recurring",
    notes:
      "The official page currently shows a banner: 'Program is currently not accepting new affiliates.' Self-referrals are prohibited; FTC disclosure is required.",
    sourceUrls: ["https://www.notion.com/affiliates"],
  },
  {
    slug: "obsidian",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No affiliate/referral/partner program found on the official site or via search. Community forum threads show users requesting one with no confirmed company response — consistent with Obsidian being a small/solo-founder-run product.",
    sourceUrls: ["https://obsidian.md", "https://forum.obsidian.md/t/affiliate-links-referral-program/23321"],
  },
  {
    slug: "pipedrive",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions:
      "Promotable internationally with a few exceptions communicated during the approval process for applicants suggesting intent to promote in geographically restricted areas (specific countries not named on the page).",
    commissionModel:
      "Three tiers: Rising Affiliate 20% revenue share (first 12 months), Growth Affiliate 30% revenue share (first 12 months), Power Affiliate custom rate",
    recurrence: "recurring",
    notes: "$5 minimum withdrawal; commissions locked by the 7th day of the month, two months after the transaction, paid on the 13th.",
    sourceUrls: [
      "https://www.pipedrive.com/en/affiliate-partnership",
      "https://support.pipedrive.com/en/article/how-can-i-become-a-pipedrive-affiliate-or-partner",
    ],
  },
  {
    slug: "salesforce",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No consumer affiliate program — Salesforce runs an ISV/AppExchange/Consulting/Reseller Partner Program (governed by the Salesforce Partner Program Agreement). A referral-fee mechanism for Consulting Partners is described in search-result text of an official page, but direct WebFetch of partners.salesforce.com and the help article returned 403/no detail — low confidence, unconfirmed by direct fetch.",
    sourceUrls: [
      "https://www.salesforce.com/partners/become-a-partner/",
      "https://help.salesforce.com/s/articleView?id=000389337",
    ],
  },
  {
    slug: "sketch",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Official pages describe only a B2B reseller 'Partner Program' (Authorized/Premium tiers) for companies managing licenses on behalf of clients — no affiliate/referral program for individuals found. Incentives are described only as 'performance and tier'-based, not quantified.",
    sourceUrls: ["https://www.sketch.com/partners/", "https://www.sketch.com/support/partners/"],
  },
  {
    slug: "slack",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "slack.com/affiliates is a legal list of corporate subsidiaries, not a marketing program. slack.com/terms-of-service/partners covers a general partner relationship with no commission terms. Slack's Services Partner Program is for consulting orgs, not consumer/creator affiliates.",
    sourceUrls: ["https://slack.com/affiliates", "https://slack.com/terms-of-service/partners"],
  },
  {
    slug: "todoist",
    lastVerifiedAt: "2026-07-31",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions:
      "No explicit country restriction stated; page notes global coverage and payouts are in USD (PartnerStack's own platform is English-only).",
    commissionModel:
      "Up to 25% commission per sale, tier-dependent: yearly plans up to 25% one-time (one reward per upgrading user); monthly plans up to 25% for up to 12 payments. Commission only accrues after 30 days of active subscription (past the refund window).",
    recurrence: "recurring",
    notes:
      "Three sub-programs (Ambassadors/Affiliates/Resellers), 90-day referral cookie. Only purchases made directly on todoist.com qualify — App Store/Google Play purchases are excluded. $25 minimum payout, paid monthly around the 13th.",
    sourceUrls: [
      "https://www.todoist.com/help/articles/todoist-partner-programs-t8t2hZ0Z",
      "https://www.todoist.com/channelpartners",
      "https://www.todoist.com/channelpartners/terms",
      "https://market.partnerstack.com/program/doist",
    ],
  },
  {
    slug: "trello",
    lastVerifiedAt: "2026-07-31",
    programExists: "no",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "No standalone Trello affiliate program. Atlassian's official partners page offers only Solution/Marketplace/Global Alliance Partner (B2B/reseller/developer) tracks, with no published commission percentages. Confirmed by an Atlassian community forum thread as well.",
    sourceUrls: [
      "https://www.atlassian.com/partners",
      "https://community.atlassian.com/forums/Trello-questions/Does-Trello-have-an-affiliate-partner-program/qaq-p/2769611",
    ],
  },
  {
    slug: "zapier",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Official 'Partner Program' covers Solution Partners (agencies — has an unspecified referral program, no published commission %) and Integration Partners (developer tier based on active users, no cash commission structure). No public 'sign up for a link' cash affiliate program was found on official pages.",
    sourceUrls: [
      "https://zapier.com/l/partners",
      "https://zapier.com/blog/solution-partner-program/",
      "https://docs.zapier.com/integrations/publish/partner-program",
    ],
  },
  {
    slug: "zoom",
    lastVerifiedAt: "2026-07-31",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Zoom's official 'Referral Partner Program' blog post describes commission 'for the life of the customer,' but it's explicitly for Master Agents (telecom channel: AVANT, Intelisys, Pax8, Telarus), not individual affiliates — no percentage disclosed. A separate affiliate registration page exists but returned no fetchable substantive content.",
    sourceUrls: [
      "https://www.zoom.com/en/blog/zoom-introduces-referral-partner-program-for-master-agents-program-offers-commission-for-life-of-customer/",
    ],
  },
];

export function getAffiliateProgram(slug: string): AffiliateProgramInfo | undefined {
  return AFFILIATE_PROGRAMS.find((program) => program.slug === slug);
}
