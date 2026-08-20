export const ACTIVE_PARTNER_SLUGS = [
  "constant-contact", "todoist", "moosend", "volza", "pipedrive",
  "getresponse", "airtable", "monday", "whatconverts", "elevenlabs", "krispcall",
  "setmore", "hubstaff",
] as const;

export type ActivePartnerSlug = (typeof ACTIVE_PARTNER_SLUGS)[number];

export type ActivePartner = {
  slug: ActivePartnerSlug;
  status: "active";
  affiliateUrl: string | null;
  blocker: "missing_affiliate_url" | null;
};

/**
 * Canonical registry for verified active partners. Null never means "guess": it keeps the ordinary vendor URL live.
 *
 * Brevo removed 2026-08-19: PartnerStack's top-level partnership badge showed
 * "Active", but the program's own Messages thread (account hello@miloosh.com)
 * contains a first-party Brevo message dated 2026-08-19: "Your application was
 * not approved... has been removed from our onboarding process." No Offer and
 * no referral link were ever attached, consistent with a rejected application.
 * See data/affiliate/partner-materials-audit.ts and
 * data/affiliate/AFFILIATE_EVIDENCE_AND_SURFACES_2026-08-19.md for full evidence.
 *
 * Setmore added 2026-08-20: real first-party approval email (network: Tapfiliate).
 * COMPLIANCE RESTRICTION -- SETMORE: NO PAID MEDIA / PPC / BRAND OR NON-BRAND ADS.
 * The approval email explicitly prohibits Google Ads, PPC, display ads, and paid
 * social advertising for this program; commissions generated through prohibited
 * paid channels will not be approved or paid. Only organic promotion is permitted
 * (blog/content, organic social, newsletters, website referrals). Any future
 * social/affiliate automation touching Setmore must respect this restriction --
 * do not schedule paid promotion or recommend paid channels for this partner.
 *
 * Hubstaff added 2026-08-20: real first-party PartnerStack partnership (account hello@miloosh.com).
 * Verified affiliate URL: https://affiliate.hubstaff.com/ca2oe167vcj1.
 */
export const ACTIVE_PARTNERS: readonly ActivePartner[] = [
  { slug: "constant-contact", status: "active", affiliateUrl: "https://join.constantcontact.com/ezj6pum5ei2l", blocker: null },
  { slug: "todoist", status: "active", affiliateUrl: "https://get.todoist.io/dobo71f2y038", blocker: null },
  { slug: "moosend", status: "active", affiliateUrl: "https://trymoo.moosend.com/4jis9o5bx8wx", blocker: null },
  { slug: "volza", status: "active", affiliateUrl: "https://partner.volza.com/36gtswr72b71", blocker: null },
  { slug: "pipedrive", status: "active", affiliateUrl: "https://aff.trypipedrive.com/ajtcgyu06e7i", blocker: null },
  { slug: "getresponse", status: "active", affiliateUrl: "https://try.getresponsetoday.com/5op8zmw94gq1", blocker: null },
  { slug: "airtable", status: "active", affiliateUrl: "https://airtable.partnerlinks.io/b0dz88v48tek", blocker: null },
  { slug: "monday", status: "active", affiliateUrl: "https://try.monday.com/1p2fpizulcj7", blocker: null },
  { slug: "whatconverts", status: "active", affiliateUrl: "https://partners.whatconverts.com/bmckzlf0vnl8", blocker: null },
  { slug: "elevenlabs", status: "active", affiliateUrl: "https://try.elevenlabs.io/gkp73pehjgtl", blocker: null },
  { slug: "krispcall", status: "active", affiliateUrl: "https://try.krispcall.com/aikpbrrrl8k9", blocker: null },
  { slug: "setmore", status: "active", affiliateUrl: "https://www.setmore.com?ref=nge2zwi", blocker: null },
  { slug: "hubstaff", status: "active", affiliateUrl: "https://affiliate.hubstaff.com/ca2oe167vcj1", blocker: null },
] as const;

const ACTIVE_PARTNERS_BY_SLUG = new Map(ACTIVE_PARTNERS.map((partner) => [partner.slug, partner]));

export function getActivePartner(slug: string): ActivePartner | undefined {
  return ACTIVE_PARTNERS_BY_SLUG.get(slug as ActivePartnerSlug);
}
