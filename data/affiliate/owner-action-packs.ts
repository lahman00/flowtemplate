/**
 * OWNER ACTION EXECUTION PACKS
 *
 * Structured instructions for the 5 highest-leverage owner actions.
 * Used to streamline owner execution so Antigravity can immediately activate programs.
 */

export interface OwnerActionPack {
  id: string;
  title: string;
  priority: number;
  loginOrSignupUrl: string;
  productsCovered: string[];
  comparisonsAffected: number;
  commissionEvidence: string;
  preFilledFields: Record<string, string>;
  ownerRequiredFields: string[];
  securityAndComplianceNotes: string;
  postCompletionAutomation: string;
}

export const OWNER_ACTION_PACKS: readonly OwnerActionPack[] = [
  {
    id: "impact-publisher-account",
    title: "1. Impact.com Publisher Portal Login & Tax Setup (W-8BEN / W-9)",
    priority: 1,
    loginOrSignupUrl: "https://app.impact.com/",
    productsCovered: [
      "semrush", "lastpass", "woocommerce", "sprout-social", "hootsuite",
      "smartsheet", "mailchimp", "shopify", "bigcommerce", "wix", "squarespace",
      "grammarly", "bitwarden", "ringcentral", "nextiva", "craft", "keeper",
      "keeper-security", "ecwid", "moz"
    ],
    comparisonsAffected: 201,
    commissionEvidence: "Impact.com verified publisher rates ($200 CPA Semrush, 25% LastPass, $100-$150 RingCentral/Nextiva, 20% Ecwid/Craft/Keeper, $25 Moz)",
    preFilledFields: {
      "Company / Site Name": "Miloosh",
      "Website URL": "https://miloosh.com",
      "Contact Email": "hello@miloosh.com",
      "Business Model": "Content / Reviews / Software Research & Comparison",
      "Primary Property": "https://miloosh.com (Software Comparison Platform)"
    },
    ownerRequiredFields: [
      "Account Login / Password for Impact.com",
      "Tax Classification (W-8BEN for non-US / W-9 for US entity)",
      "Bank Account / PayPal payout routing details",
      "Click 'Apply / Join Campaign' for each brand inside Impact marketplace"
    ],
    securityAndComplianceNotes: "Owner only — never share passwords or tax documents with AI agents. Ensure compliance with FTC affiliate disclosure requirements.",
    postCompletionAutomation: "Once campaigns are approved and affiliate URLs generated, paste the URLs into data/affiliate/active-partners.ts to enable automatic tracking and CTA rendering across 201 comparison surfaces."
  },
  {
    id: "partnerstack-marketplace-confirmation",
    title: "2. PartnerStack In-App Category & Audience Profile Confirmation",
    priority: 2,
    loginOrSignupUrl: "https://dash.partnerstack.com/",
    productsCovered: [
      "document360", "mixpanel", "reclaim-ai", "dialpad", "calendly", "motion",
      "guru", "scribe", "nutshell", "keap", "ruler-analytics", "front", "descript",
      "hotjar", "coda", "klaviyo", "gorgias", "quickbooks-online", "miro", "partnerstack"
    ],
    comparisonsAffected: 180,
    commissionEvidence: "PartnerStack standard marketplace offers (15-30% recurring on Document360, Reclaim AI, Guru, Scribe, Nutshell, Keap, Front, Descript, Hotjar)",
    preFilledFields: {
      "Website URL": "https://miloosh.com",
      "Publisher Category": "Software Review & Comparison Platform",
      "Audience Description": "SMB owners, growth operators, freelancers, and software buyers researching B2B SaaS solutions",
      "Primary Traffic Source": "Organic Search (Google / Bing / LLM Search Referrals)"
    },
    ownerRequiredFields: [
      "Sign in to existing PartnerStack Account (hello@miloosh.com)",
      "Select monthly traffic bracket / audience size on vendor-specific in-app forms",
      "Accept updated PartnerStack network referral terms",
      "Confirm agency/reseller checkbox as 'Affiliate / Publisher / Content Creator'"
    ],
    securityAndComplianceNotes: "Do not select 'Reseller / Certified Implementation Agency' unless formal certified deployment proofs are available.",
    postCompletionAutomation: "PartnerStack will approve applications directly into the existing authenticated dashboard. Running `npm run affiliate:status` will pull new active links."
  },
  {
    id: "cj-publisher-registration",
    title: "3. Commission Junction (CJ) Publisher Account Registration",
    priority: 3,
    loginOrSignupUrl: "https://signup.cj.com/member/signup/publisher/?cid=5140517",
    productsCovered: [
      "1password", "dashlane", "acuity-scheduling", "google-meet", "google-chat", "evernote"
    ],
    comparisonsAffected: 66,
    commissionEvidence: "CJ verified rates: 25% first year on 1Password, $20 on Dashlane, up to $30/seat on Google Workspace",
    preFilledFields: {
      "Account Name": "Miloosh",
      "Promotional Property": "https://miloosh.com",
      "Property Type": "Website / Content / Comparison Engine",
      "Email Address": "hello@miloosh.com"
    },
    ownerRequiredFields: [
      "Create master CJ account password",
      "Submit electronic W-8BEN/W-9 form",
      "Set up direct deposit / Payoneer banking details",
      "Search Advertiser IDs: 5140517 (1Password), Dashlane, Google Workspace"
    ],
    securityAndComplianceNotes: "CJ accounts require phone/2FA verification during initial onboarding.",
    postCompletionAutomation: "Add CJ publisher ID and campaign tracking links to data/affiliate/canonical-ledger.ts."
  },
  {
    id: "zoho-partner-signup",
    title: "4. Zoho Affiliate Ecosystem Password Account Creation",
    priority: 4,
    loginOrSignupUrl: "https://www.zoho.com/affiliate/signup.html",
    productsCovered: [
      "zoho-crm", "zoho-books", "zoho-projects", "zoho-desk", "zoho-flow"
    ],
    comparisonsAffected: 45,
    commissionEvidence: "15% recurring revenue share on all Zoho apps for 12 months",
    preFilledFields: {
      "Website": "https://miloosh.com",
      "Promotion Method": "Editorial comparisons and software buying guides",
      "Contact Email": "hello@miloosh.com"
    },
    ownerRequiredFields: [
      "Create Zoho user password for hello@miloosh.com",
      "Complete phone/SMS verification",
      "Submit payout details inside Zoho Affiliate Portal"
    ],
    securityAndComplianceNotes: "Single login unlocks all 5 Zoho catalog products across CRM, Accounting, and Project Management.",
    postCompletionAutomation: "Activate `zoho-ecosystem` affiliate URL in active-partners registry to monetize 45 comparison routes."
  },
  {
    id: "shareasale-publisher-account",
    title: "5. ShareASale Publisher Account Registration",
    priority: 5,
    loginOrSignupUrl: "https://www.shareasale.com/join/",
    productsCovered: [
      "shift4shop", "weebly", "later"
    ],
    comparisonsAffected: 23,
    commissionEvidence: "ShareASale rates: $100 per merchant (Shift4Shop), 30% subscription (Weebly), $20 (Later)",
    preFilledFields: {
      "Website URL": "https://miloosh.com",
      "Site Description": "Miloosh provides objective software reviews, comparisons, and role-based buyer guides",
      "Account Email": "hello@miloosh.com"
    },
    ownerRequiredFields: [
      "Set account password and PIN",
      "Verify ownership via meta tag / email confirmation",
      "Submit tax ID & payment method"
    ],
    securityAndComplianceNotes: "ShareASale reviews publisher websites within 1-2 business days.",
    postCompletionAutomation: "Link approved merchant affiliate links into `data/affiliate/active-partners.ts`."
  }
];
