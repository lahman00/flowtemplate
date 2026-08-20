import { PUBLISHED_COMPARISONS } from "@/data/comparisons";

export function analyzeOwnerBlockers() {
  console.log("================================================================");
  console.log("         OWNER BLOCKER CONSOLIDATION & LEVERAGE MATRIX          ");
  console.log("================================================================\n");

  const compCountMap = new Map<string, number>();
  for (const [a, b] of PUBLISHED_COMPARISONS) {
    compCountMap.set(a, (compCountMap.get(a) || 0) + 1);
    compCountMap.set(b, (compCountMap.get(b) || 0) + 1);
  }

  const rootCauses = [
    {
      name: "1. Impact.com Publisher Account (Tax Form & W-8BEN/W-9 Login)",
      action: "Sign into app.impact.com and submit publisher tax documentation (W-8BEN/W-9) + approve partner terms.",
      programs: ["impact-portfolio"],
      products: ["semrush", "lastpass", "woocommerce", "sprout-social", "hootsuite", "smartsheet", "mailchimp", "shopify", "bigcommerce", "wix", "squarespace", "grammarly", "bitwarden", "ringcentral", "nextiva", "craft", "keeper", "keeper-security", "ecwid", "moz"]
    },
    {
      name: "2. PartnerStack In-App Category Confirmation (Audience & Profile Questions)",
      action: "Log into dash.partnerstack.com and complete the in-app profile / audience tiers for pending marketplace programs.",
      programs: ["partnerstack-portfolio", "partnerstack-referral"],
      products: ["document360", "mixpanel", "reclaim-ai", "dialpad", "calendly", "motion", "guru", "scribe", "nutshell", "keap", "ruler-analytics", "front", "descript", "hotjar", "coda", "klaviyo", "gorgias", "quickbooks-online", "miro", "partnerstack"]
    },
    {
      name: "3. Commission Junction (CJ) Publisher Account Creation",
      action: "Complete CJ publisher account registration with tax/bank details on signup.cj.com.",
      programs: ["cj-portfolio"],
      products: ["1password", "dashlane", "acuity-scheduling", "google-meet", "google-chat", "evernote"]
    },
    {
      name: "4. Zoho Affiliate Account Password Creation",
      action: "Create a password-authenticated Zoho user account for hello@miloosh.com on zoho.com/affiliate/signup.html.",
      programs: ["zoho-ecosystem"],
      products: ["zoho-crm", "zoho-books", "zoho-projects", "zoho-desk", "zoho-flow"]
    },
    {
      name: "5. ShareASale Publisher Account Creation",
      action: "Create a ShareASale publisher account on shareasale.com.",
      programs: ["shareasale-portfolio"],
      products: ["shift4shop", "weebly", "later"]
    },
    {
      name: "6. Single Vendor Account / Password Registrations",
      action: "Create user account / password for FirstPromoter, Rewardful, and direct vendor affiliate programs.",
      programs: ["firstpromoter-portfolio", "rewardful-portfolio", "notion", "asana", "fathom-analytics", "buffer", "liveagent", "gohighlevel", "make", "property-and-field-portfolio", "developer-and-enterprise-portfolio", "collaboration-and-design-portfolio", "support-and-crm-portfolio"],
      products: ["jasper", "ghost", "copy-ai", "crisp", "helpjuice", "murf-ai", "archbee", "savvycal", "notion", "asana", "fathom-analytics", "buffer", "liveagent", "gohighlevel", "make", "jobber", "housecall-pro", "buildium", "doorloop", "tenantcloud", "netlify", "vercel", "stripe", "apigee", "tray-ai", "uipath", "workato", "shortcut", "zoom", "lucidchart", "rocket-chat", "framer", "teamwork", "gitbook", "doodle", "cal-com", "bloomfire", "nordpass", "copper", "intercom", "happyfox", "reamaze", "prestashop"]
    },
    {
      name: "7. Corporate Partner Agreements (SI / Enterprise Reseller)",
      action: "Sign formal ISV / SI partner agreements with Adobe, Microsoft, Salesforce, Cisco, and Twilio.",
      programs: ["adobe-portfolio", "microsoft-portfolio", "salesforce-portfolio", "cisco-portfolio", "twilio-portfolio"],
      products: ["marketo-engage", "adobe-analytics", "adobe-commerce", "microsoft-teams", "microsoft-bookings", "power-automate", "salesforce", "salesforce-commerce-cloud", "mulesoft", "webex", "duo-security", "twilio", "sendgrid", "segment"]
    }
  ];

  for (const rc of rootCauses) {
    let compsAffected = 0;
    for (const slug of rc.products) {
      compsAffected += compCountMap.get(slug) || 0;
    }

    console.log(`----------------------------------------------------------------`);
    console.log(`${rc.name}`);
    console.log(`Action:                ${rc.action}`);
    console.log(`Programs Unlocked:     ${rc.programs.length}`);
    console.log(`Products Covered:      ${rc.products.length} products`);
    console.log(`Comparisons Affected:  ${compsAffected} comparison surfaces`);
  }

  console.log(`\n================================================================\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeOwnerBlockers();
}
