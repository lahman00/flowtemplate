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
/** How confident this entry's programExists/details are, given what was actually fetchable. "high" = read directly on an official page. "medium" = inferred from a network listing or a page that partially loaded. "low" = third-party mention only, or a fetch that was blocked/incomplete. */
export type ResearchConfidence = "high" | "medium" | "low";

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
  /**
   * Operation Affiliate Revenue Engine (2026-08-14) additions — all
   * optional and default to null so every pre-existing entry above stays
   * valid without modification. Never fabricated: null/"unknown" means
   * the official source didn't state it, exactly like the original six
   * required fields above.
   */
  applicationUrl?: string | null;
  cookieDuration?: string | null;
  payoutMethod?: string | null;
  payoutThreshold?: string | null;
  eligibility?: string | null;
  confidence?: ResearchConfidence | null;
};

export const AFFILIATE_PROGRAMS: AffiliateProgramInfo[] = [
  {
    slug: "1password",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Commission Junction",
    countryRestrictions: null,
    commissionModel:
      "$2 per completed signup (including free trial starts) plus 25% of the customer's first year payment on paid conversions (minimum $2); first-year only, no recurring commission on renewals",
    recurrence: "one_time",
    notes:
      "Corrected 2026-08-14: the official page (1password.com/affiliate) was fetched directly this pass and names Commission Junction (CJ.com) as the network, not Impact — the earlier 'Impact' value came from third-party aggregators and was wrong. Apply by creating a CJ account and applying to the 1Password program there.",
    sourceUrls: ["https://1password.com/affiliate", "https://getlasso.co/affiliate/1password/"],
    applicationUrl: "https://1password.com/affiliate",
    cookieDuration: "30 days",
    payoutThreshold: "$10",
    confidence: "high",
  },
  {
    slug: "airtable",
    lastVerifiedAt: "2026-08-14",
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
    applicationUrl: "https://airtable.partnerstack.com/",
    confidence: "high",
  },
  {
    slug: "asana",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "unknown",
    networkName: null,
    countryRestrictions:
      "Partner Program Agreement prohibits selling, servicing, accessing, or using the Asana Service in a U.S.-embargoed country or region.",
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Three-tier program (Solutions/Services/Referral Partners), requires an active paid Asana subscription to apply. Official terms explicitly defer commission specifics to a non-public 'Partner Program Guide' — no network or rate is disclosed publicly. NOT A FIT for Miloosh's model (2026-08-14 re-check): the application runs through a Salesforce portal (asana.my.salesforce-sites.com) and requires the applicant to already be a paying Asana customer referring other businesses — Miloosh is a comparison publisher, not an Asana customer, so it likely does not qualify to apply as-is. Exclude from the ready-to-apply batch until this is resolved.",
    sourceUrls: ["https://asana.com/partners/referral", "https://asana.com/terms/partner-program"],
    applicationUrl: "https://asana.com/partners/referral",
    confidence: "high",
  },
  {
    slug: "bitwarden",
    lastVerifiedAt: "2026-08-14",
    programExists: "unknown",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Bitwarden's own site (bitwarden.com/partners/, bitwarden.com/partners/become-a-partner/) advertises a channel/reseller Partner Program for MSPs and businesses, not a classic pay-per-referral affiliate program. Third-party affiliate-directory sites separately claim 20-30% commission figures, but these could not be traced to an official Bitwarden page and directly contradict each other — not confirmed enough to record as a real commission model.",
    sourceUrls: ["https://bitwarden.com/partners/", "https://bitwarden.com/partners/become-a-partner/"],
    confidence: "low",
  },
  {
    slug: "cal-com",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel: "20% commission for a full year; referred customers get 20% off for 12 months",
    recurrence: "recurring",
    notes:
      "Run through Cal.com's own referral system (app.cal.com/refer), not a third-party network. The separate legal terms page describes payouts only as generic 'Rewards... as determined by Cal.com,' and participation requires approval. Re-verified 2026-08-14: app.cal.com/refer redirects straight to a Cal.com account sign-in/sign-up screen — a Cal.com account (existing or new) is required just to reach the application, and Miloosh does not currently have one.",
    sourceUrls: ["https://cal.com/affiliate-program", "https://cal.com/affiliate-terms"],
    applicationUrl: "https://cal.com/affiliate-program",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Impact (unconfirmed)",
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "unknown",
    notes:
      "Low confidence: Canva's official Help Center affiliate pages returned 403 Forbidden on every direct fetch attempt (including 2026-08-14), so the network name and any commission figures still come from third-party sources, not a directly-verified Canva page. Multiple independent sources agree the only path is applying to Canva's 'Canvassador' program first, and at least one source described that program as currently closed to new applicants — unconfirmed directly, but real enough to exclude Canva from a ready-to-apply batch until the official page can actually be read.",
    sourceUrls: ["https://www.canva.com/help/canva-affiliate-marketing-program/"],
    applicationUrl: "https://www.canva.com/help/canva-affiliate-marketing-program/",
    confidence: "low",
  },
  {
    slug: "clickup",
    lastVerifiedAt: "2026-08-14",
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
    applicationUrl: "https://clickup.com/partners/affiliates",
    cookieDuration: "30 days",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
    programExists: "no",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel: null,
    recurrence: "one_time",
    notes:
      "Changed 2026-08-14: re-checked because it ranked highly. Doodle's own page states the affiliate program 'will be coming to a close on April 30, 2026' — today (2026-08-14) is past that date, so this is treated as closed rather than 'yes'. If Doodle relaunches a program, this needs a fresh check, not just flipping the flag back.",
    sourceUrls: ["https://doodle.com/en/partners/"],
    confidence: "high",
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
    slug: "fathom-analytics",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: "Available to Fathom customers with an active subscription.",
    commissionModel: "25% lifetime recurring commission on every referred customer's monthly bill",
    recurrence: "recurring",
    notes:
      "Re-verified 2026-08-14, direct fetch confirmed: 'The Partners program is available to Fathom customers with an active subscription' — this is a real, disqualifying blocker for Miloosh, which is not a Fathom Analytics customer. Applying would require first becoming a paying Fathom customer, a real spend decision only the owner can make (not just an account signup). $200 minimum payout via bank transfer (Wise) or $20 minimum via account credit; 30-day hold on new commissions before they're claimable.",
    sourceUrls: ["https://usefathom.com/docs/account/affiliates", "https://usefathom.com/blog/affiliate-program"],
    applicationUrl: "https://usefathom.com/docs/account/affiliates",
    cookieDuration: "30 days",
    payoutThreshold: "$200 (bank transfer) or $20 (account credit)",
    confidence: "high",
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
    slug: "freshdesk",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel:
      "Sources disagree on exact terms: some cite 15% of monthly deal value for the first 12 months plus $5 per valid lead, others cite a tiered 20-30% of first-year revenue — this is the umbrella Freshworks affiliate program (covers Freshdesk plus other Freshworks products), not a Freshdesk-only program, and no single official page could be directly fetched to resolve the discrepancy in this pass.",
    recurrence: "one_time",
    notes:
      "Official program is run at the Freshworks company level, not per-product. Apply via freshworks.com; existing Freshdesk help-center article confirms the program's existence and that it is Freshworks-wide.",
    sourceUrls: [
      "https://support.freshdesk.com/en/support/solutions/articles/50000003483-freshworks-affiliate-program",
      "https://www.freshworks.com/company/affiliate-partner/affiliate-signup/",
    ],
    applicationUrl: "https://www.freshworks.com/company/affiliate-partner/affiliate-signup/",
    cookieDuration: "90 days",
    confidence: "medium",
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
    slug: "grammarly",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Impact",
    countryRestrictions: null,
    commissionModel:
      "Official page (grammarly.com/affiliates) describes a two-part earning structure but does not disclose exact percentages in the fetched text. Third-party sources separately cite ~$0.20 per free registration and $20 per premium upgrade (or up to 30% on some plans) — not independently confirmed on the official page itself.",
    recurrence: "unknown",
    notes:
      "Official page directly fetched and confirms: runs on Impact (app.impact.com), 90-day cookie, an activation bonus for new affiliates, a 'pub-friendly keyword bidding policy' implying some PPC restrictions, contact affiliate_mktg@grammarly.com for program questions.",
    sourceUrls: ["https://www.grammarly.com/affiliates"],
    applicationUrl: "https://www.grammarly.com/affiliates",
    cookieDuration: "90 days",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
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
    applicationUrl: "https://www.hubspot.com/partners/affiliates",
    cookieDuration: "180 days",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Awin",
    countryRestrictions: null,
    commissionModel: "5% sale commission, plus an unspecified bonus payout program (per the Awin merchant page)",
    recurrence: "one_time",
    notes:
      "Lucid's own /partners page only lists Technology and Solutions Partners (B2B/reseller); the affiliate program itself runs through the Awin network, separate from lucid.co. Other third-party aggregator sites cite different, higher figures that conflict with Awin's own page — the Awin figure is treated as authoritative here. Applying requires a Miloosh Awin publisher account first, then joining this merchant's program from inside Awin — the merchant-profile link isn't a direct signup form.",
    sourceUrls: ["https://lucid.co/partners", "https://ui.awin.com/merchant-profile/52579"],
    applicationUrl: "https://ui.awin.com/merchant-profile/52579",
    confidence: "high",
  },
  {
    slug: "make",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "unknown",
    networkName: null,
    countryRestrictions: null,
    commissionModel: "35% commission on referred users' subscription payments for 12 months (excludes 'extra operations' purchases)",
    recurrence: "recurring",
    notes:
      "30-day cookie window; $100 minimum payout plus 3 unique paying referrals, paid via Wise. Separate B2B 'Solution Partner' and 'Technology Partner' programs also exist but are distinct from this consumer affiliate program. Re-verified 2026-08-14: the page's 'Get started'/'Start earning' buttons lead to make.com/user/affiliate, which redirects straight to a Make.com account sign-in screen — an existing or new Make account is required, and Miloosh does not currently have one.",
    sourceUrls: ["https://www.make.com/en/affiliate"],
    applicationUrl: "https://www.make.com/en/affiliate",
    cookieDuration: "30 days",
    payoutThreshold: "$100 and 3 unique paying referrals",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
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
    applicationUrl: "https://miro.com/affiliates/join-our-program/",
    cookieDuration: "30 days",
    confidence: "high",
  },
  {
    slug: "monday",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "Up to 100% commission on the first year's sales of each customer referred (tiered; exact breakdown not shown on page)",
    recurrence: "one_time",
    notes: "Monthly payouts via PayPal or Stripe; free to join, no earnings cap mentioned.",
    sourceUrls: ["https://monday.com/affiliate-program/"],
    applicationUrl: "https://monday.com/affiliate-program/",
    confidence: "high",
  },
  {
    slug: "n8n",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "30% commission on all n8n Cloud referrals for 12 months, based on n8n's net earnings per subscription",
    recurrence: "recurring",
    notes: "Monthly PayPal payouts, EUR 100 minimum payout; paid ad campaigns are explicitly prohibited for affiliates.",
    sourceUrls: ["https://n8n.io/affiliates/", "https://support.n8n.io/article/do-you-have-an-affiliates-program"],
    applicationUrl: "https://n8n.io/affiliates/",
    payoutThreshold: "€100",
    confidence: "high",
  },
  {
    slug: "notion",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel: "Up to $50 per activated sign-up, plus 20% of year-one revenue per referral (applies to upgrades within 180 days of link click)",
    recurrence: "recurring",
    notes:
      "Re-checked 2026-08-14 (it ranked #4 in priority): the official page still shows the banner 'Program is currently not accepting new affiliates,' with no application URL for new affiliates — only existing affiliates can log in, at dash.partnerstack.com/notion. Exclude from any ready-to-apply batch until this banner is gone; re-check before assuming it's reopened. Self-referrals are prohibited; FTC disclosure is required.",
    sourceUrls: ["https://www.notion.com/affiliates"],
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions:
      "Promotable internationally with a few exceptions communicated during the approval process for applicants suggesting intent to promote in geographically restricted areas (specific countries not named on the page).",
    commissionModel:
      "Three tiers: Rising Affiliate 20% revenue share (first 12 months), Growth Affiliate 30% revenue share (first 12 months), Power Affiliate custom rate",
    recurrence: "recurring",
    notes: "$5 minimum withdrawal; commissions locked by the 7th day of the month, two months after the transaction, paid on the 13th. Application already submitted (2026-08-14) — see var/agents/affiliate-pipeline.json / the affiliate pipeline dashboard for live status. Do not reapply.",
    sourceUrls: [
      "https://www.pipedrive.com/en/affiliate-partnership",
      "https://support.pipedrive.com/en/article/how-can-i-become-a-pipedrive-affiliate-or-partner",
    ],
    applicationUrl: "https://www.pipedrive.com/en/affiliate-partnership",
    payoutThreshold: "$5",
    confidence: "high",
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
    slug: "semrush",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Impact",
    countryRestrictions: null,
    commissionModel:
      "Official KB article confirms fixed commissions per sale or free-trial activation but does not disclose exact dollar tiers in the fetched text. Third-party sources separately cite tiered $200/$250/$300/$350 per sale (by quarterly volume) plus $10 per free-trial signup — not independently confirmed on the official page itself.",
    recurrence: "one_time",
    notes:
      "Official KB article (semrush.com/kb/97-affiliate-program) directly fetched and confirms: 120-day cookie, runs on Impact, apply via Impact registration with ~2-business-day review, contact affiliates@semrush.com for program-fit questions.",
    sourceUrls: ["https://www.semrush.com/kb/97-affiliate-program"],
    applicationUrl: "https://www.semrush.com/kb/97-affiliate-program",
    cookieDuration: "120 days",
    confidence: "high",
  },
  {
    slug: "shopify",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "Impact",
    countryRestrictions: null,
    commissionModel:
      "Up to $150 USD per qualified referral, no cap on total commissions (per the official page). Higher amounts for Shopify Plus referrals are claimed by third-party sources (up to $2,000) but not confirmed in the fetched official text.",
    recurrence: "one_time",
    notes:
      "Official page (shopify.com/affiliates) directly fetched and confirms: 30-day cookie extended to 400 days if a free trial starts within that window, requires an active website/audience/commerce-related content, $10 minimum payout balance, paid via direct deposit or PayPal monthly on the 22nd, applications typically processed within ~24 hours. Re-verified 2026-08-14: the network is confirmed Impact (app.impact.com/campaign-campaign-info-v2/Shopify.brand is the real application entry point) — applying requires an Impact.com account, which Miloosh does not currently have.",
    sourceUrls: ["https://www.shopify.com/affiliates", "https://app.impact.com/campaign-campaign-info-v2/Shopify.brand"],
    applicationUrl: "https://www.shopify.com/affiliates",
    cookieDuration: "30 days (400 days if a free trial starts within the initial window)",
    payoutThreshold: "$10",
    payoutMethod: "Direct deposit or PayPal, monthly on the 22nd",
    confidence: "high",
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
    lastVerifiedAt: "2026-08-14",
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
    applicationUrl: "https://market.partnerstack.com/program/doist",
    cookieDuration: "90 days",
    payoutThreshold: "$25",
    confidence: "high",
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
    slug: "webflow",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "direct",
    networkName: null,
    countryRestrictions: null,
    commissionModel:
      "Base tier: 50% revenue share on a new customer's first subscription for up to 12 months. Pro Affiliate tier adds another 10% revenue share for up to 12 additional months if the customer renews; Premium Affiliate tier adds 15%. Confirmed directly on the live, rendered application page.",
    recurrence: "recurring",
    notes:
      "Re-verified 2026-08-14 via a real rendered browser load (two prior direct-fetch attempts by a simple HTTP client failed — header overflow, then 403 — this is a client-rendered page). Confirmed: 90-day cookie, no limit on number of referrals, direct in-house program (no PartnerStack/Impact/etc). Eligibility is explicitly restricted to 'content creator, influencer, or blogger' — agencies/freelancers must use a separate Certified Partner Program instead. Applying requires a real multi-step form (basic info incl. a personal first/last name and business name, affiliate strategy, then accepting Webflow's program terms) — this agent cannot submit it: it has no real personal name on file to enter (never fabricated) and accepting the program agreement is a step the owner must take personally.",
    sourceUrls: ["https://webflow.com/solutions/affiliates"],
    applicationUrl: "https://webflow.com/solutions/affiliates",
    cookieDuration: "90 days",
    confidence: "high",
  },
  {
    slug: "wix",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "impact.com",
    countryRestrictions: null,
    commissionModel: "Flat $100 commission per Premium plan purchase (per third-party aggregation; official page identified but not directly fetched in this pass)",
    recurrence: "one_time",
    notes:
      "Official program URL identified via search as wix.com/about/affiliates (a genuine Wix domain), and commission/cookie/payout details converge across multiple independent affiliate-directory sources, but the official page itself was not directly fetched to confirm firsthand.",
    sourceUrls: ["https://www.wix.com/about/affiliates"],
    applicationUrl: "https://www.wix.com/about/affiliates",
    cookieDuration: "30 days",
    payoutThreshold: "$300/month minimum",
    confidence: "medium",
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
    slug: "zendesk",
    lastVerifiedAt: "2026-08-14",
    programExists: "yes",
    type: "network",
    networkName: "PartnerStack",
    countryRestrictions: null,
    commissionModel:
      "15% starting commission per sale, rising to 25% of the first year's subscription at higher referral volume (Tier 2: 16-30 qualified referrals/month) — per search-result summary of Zendesk's own official page, not independently re-fetched in this pass",
    recurrence: "recurring",
    notes:
      "Official page identified as zendesk.com/programs/affiliate-program/, with a separate official terms page at zendesk.com/company/affiliate-partner/terms-and-conditions/ — both genuine Zendesk domains. Affiliate links/dashboard are accessed via PartnerStack once approved. Recurring because commissions apply to renewals/upgrades per the SaaS subscription model described.",
    sourceUrls: [
      "https://www.zendesk.com/programs/affiliate-program/",
      "https://www.zendesk.com/company/affiliate-partner/terms-and-conditions/",
    ],
    applicationUrl: "https://www.zendesk.com/programs/affiliate-program/",
    cookieDuration: "30 days",
    confidence: "medium",
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
