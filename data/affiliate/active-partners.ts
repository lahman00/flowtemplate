export const ACTIVE_PARTNER_SLUGS = [
  "constant-contact", "todoist", "moosend", "volza", "brevo", "pipedrive",
  "getresponse", "airtable", "monday", "whatconverts", "elevenlabs", "krispcall",
] as const;

export type ActivePartnerSlug = (typeof ACTIVE_PARTNER_SLUGS)[number];

export type ActivePartner = {
  slug: ActivePartnerSlug;
  status: "active";
  affiliateUrl: string | null;
  blocker: "missing_affiliate_url" | null;
};

/** Canonical registry for verified active partners. Null never means "guess": it keeps the ordinary vendor URL live. */
export const ACTIVE_PARTNERS: readonly ActivePartner[] = [
  { slug: "constant-contact", status: "active", affiliateUrl: "https://join.constantcontact.com/ezj6pum5ei2l", blocker: null },
  { slug: "todoist", status: "active", affiliateUrl: "https://get.todoist.io/dobo71f2y038", blocker: null },
  { slug: "moosend", status: "active", affiliateUrl: "https://trymoo.moosend.com/4jis9o5bx8wx", blocker: null },
  { slug: "volza", status: "active", affiliateUrl: "https://partner.volza.com/36gtswr72b71", blocker: null },
  { slug: "brevo", status: "active", affiliateUrl: null, blocker: "missing_affiliate_url" },
  { slug: "pipedrive", status: "active", affiliateUrl: "https://aff.trypipedrive.com/ajtcgyu06e7i", blocker: null },
  { slug: "getresponse", status: "active", affiliateUrl: "https://try.getresponsetoday.com/5op8zmw94gq1", blocker: null },
  { slug: "airtable", status: "active", affiliateUrl: "https://airtable.partnerlinks.io/b0dz88v48tek", blocker: null },
  { slug: "monday", status: "active", affiliateUrl: "https://try.monday.com/1p2fpizulcj7", blocker: null },
  { slug: "whatconverts", status: "active", affiliateUrl: "https://partners.whatconverts.com/bmckzlf0vnl8", blocker: null },
  { slug: "elevenlabs", status: "active", affiliateUrl: "https://try.elevenlabs.io/gkp73pehjgtl", blocker: null },
  { slug: "krispcall", status: "active", affiliateUrl: "https://try.krispcall.com/aikpbrrrl8k9", blocker: null },
] as const;

const ACTIVE_PARTNERS_BY_SLUG = new Map(ACTIVE_PARTNERS.map((partner) => [partner.slug, partner]));

export function getActivePartner(slug: string): ActivePartner | undefined {
  return ACTIVE_PARTNERS_BY_SLUG.get(slug as ActivePartnerSlug);
}
