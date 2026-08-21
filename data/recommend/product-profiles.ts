import type { RecommendDomain } from "@/lib/recommend/domains";

/**
 * Recommend Engine Rebuild (2026-08-21) — the domain-eligibility layer.
 *
 * This is the answer to "is this even a plausible choice for this
 * buyer?" (Phase 7 of the rebuild brief), checked BEFORE scoring, not
 * after. Before this file existed, every one of the 247 catalog products
 * was scored against every answer set with no eligibility gate at all —
 * a product could theoretically surface for a domain it has nothing to
 * do with just by scoring non-negatively on generic team-size/budget
 * factors. This file makes that structurally impossible for any domain
 * a buyer explicitly selects: lib/recommend/eligibility.ts only scores a
 * product against a domain if that domain appears in this list for that
 * slug.
 *
 * Every entry here was built from the product's own real, already-
 * verified data/software/*.json category and description/bestFor text —
 * nothing invented. A product not listed here for a given domain is not
 * "confirmed unsuitable," it's simply "not evidenced" — which is exactly
 * why it stays excluded rather than scored on a guess.
 *
 * Deliberately NOT every one of the 247 catalog products: only the ones
 * with real, checkable evidence for one of the 13 domains in
 * lib/recommend/domains.ts. A product entirely absent from this file
 * (e.g. a CMS, an API infra tool, a design tool) is CATALOG_ONLY for
 * Recommend purposes — see scripts/recommend/coverage-report.ts — not a
 * gap to force-fill.
 *
 * No affiliate information of any kind lives in this file or is read by
 * anything that reads it — see tests/lib/recommend-affiliate-neutrality.test.ts.
 *
 * Multi-domain audit (2026-08-21 integrity patch): the original authoring
 * pass grouped products by one domain at a time and never revisited a
 * product for a second domain, so real dual-fit evidence (e.g. Notion's
 * own stored feature list) was missed — the type below was always
 * multi-domain-capable, the data just never used it. Explicitly re-audited
 * against each candidate's real data/software/*.json features/description:
 * hubspot (email_marketing/help_desk considered — its stored features read
 * as sales-email and live-chat, not a documented marketing-campaign or
 * ticketing product, kept crm-only), clickup and slack (each has one
 * "wiki"/"Canvas" doc feature, but framed as subordinate to their core
 * product rather than a genuine knowledge-base buyer destination, kept
 * single-domain), airtable (no task/project language in its stored
 * features at all — a no-code database tool with no matching domain, kept
 * CATALOG_ONLY), freshdesk and intercom (no knowledge-base feature in
 * their stored data, unlike zoho-desk — kept help_desk-only), monday,
 * microsoft-teams, hubstaff, and buffer (no second-domain evidence in
 * their stored data). Only notion and zoho-desk had real, explicit,
 * stored-feature-level evidence for a second domain.
 */

export type ProductProfile = {
  slug: string;
  /** Every domain this product has real evidence for. Most products have exactly one; a few genuinely span two (documented per-entry below where non-obvious). */
  domains: RecommendDomain[];
};

// prettier-ignore
export const PRODUCT_PROFILES: readonly ProductProfile[] = [
  // ---- project_management (category: project-management, 12 products) ----
  { slug: "asana", domains: ["project_management"] },
  { slug: "basecamp", domains: ["project_management"] },
  { slug: "clickup", domains: ["project_management"] },
  { slug: "jira", domains: ["project_management"] },
  { slug: "linear", domains: ["project_management"] },
  { slug: "monday", domains: ["project_management"] },
  { slug: "shortcut", domains: ["project_management"] },
  { slug: "smartsheet", domains: ["project_management"] },
  { slug: "teamwork", domains: ["project_management"] },
  { slug: "trello", domains: ["project_management"] },
  { slug: "wrike", domains: ["project_management"] },
  { slug: "zoho-projects", domains: ["project_management"] },

  // ---- crm (category: crm, 10 products) ----
  { slug: "close", domains: ["crm"] },
  { slug: "copper", domains: ["crm"] },
  { slug: "freshsales", domains: ["crm"] },
  { slug: "gohighlevel", domains: ["crm"] },
  { slug: "hubspot", domains: ["crm"] },
  { slug: "keap", domains: ["crm"] },
  { slug: "nutshell", domains: ["crm"] },
  { slug: "pipedrive", domains: ["crm"] },
  { slug: "salesforce", domains: ["crm"] },
  { slug: "zoho-crm", domains: ["crm"] },

  // ---- knowledge_base (category: knowledge-base, 10 products) ----
  { slug: "bloomfire", domains: ["knowledge_base"] },
  { slug: "confluence", domains: ["knowledge_base"] },
  { slug: "gitbook", domains: ["knowledge_base"] },
  { slug: "guru", domains: ["knowledge_base"] },
  { slug: "helpjuice", domains: ["knowledge_base"] },
  { slug: "knowledgeowl", domains: ["knowledge_base"] },
  { slug: "obsidian", domains: ["knowledge_base"] },
  { slug: "stack-overflow-for-teams", domains: ["knowledge_base"] },
  { slug: "tettra", domains: ["knowledge_base"] },
  { slug: "trainual", domains: ["knowledge_base"] },

  // ---- notion (category: productivity — genuine multi-domain: its own data/software/notion.json
  // lists "Wiki and knowledge base pages" AND "Project and task tracking" as two coequal, top-level
  // features, not one subordinate to the other, and the description itself names both as core
  // ("documents, databases, project tracking, and team knowledge in one flexible workspace"). Real
  // buyers genuinely begin in either domain and land on Notion. Found during the 2026-08-21 integrity
  // patch's multi-domain audit — was CATALOG_ONLY before, missed in the original single-pass authoring
  // that grouped products by one domain at a time and never revisited any product for a second. ----
  { slug: "notion", domains: ["knowledge_base", "project_management"] },

  // ---- automation (category: automation, 10 products) ----
  { slug: "ifttt", domains: ["automation"] },
  { slug: "make", domains: ["automation"] },
  { slug: "n8n", domains: ["automation"] },
  { slug: "pipedream", domains: ["automation"] },
  { slug: "power-automate", domains: ["automation"] },
  { slug: "tray-ai", domains: ["automation"] },
  { slug: "uipath", domains: ["automation"] },
  { slug: "workato", domains: ["automation"] },
  { slug: "zapier", domains: ["automation"] },
  { slug: "zoho-flow", domains: ["automation"] },

  // ---- communication (category: communication, 15 products) ----
  { slug: "dialpad", domains: ["communication"] },
  { slug: "discord", domains: ["communication"] },
  { slug: "google-chat", domains: ["communication"] },
  { slug: "google-meet", domains: ["communication"] },
  { slug: "krispcall", domains: ["communication"] },
  { slug: "mattermost", domains: ["communication"] },
  { slug: "microsoft-teams", domains: ["communication"] },
  { slug: "nextiva", domains: ["communication"] },
  { slug: "ringcentral", domains: ["communication"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "rocket-chat", domains: ["communication"] },
  { slug: "signal", domains: ["communication"] },
  { slug: "slack", domains: ["communication"] },
  { slug: "telegram", domains: ["communication"] },
  { slug: "webex", domains: ["communication"] },
  { slug: "zoom", domains: ["communication"] },

  // ---- help_desk (category: customer-support, 13 products — all genuinely ticketing/shared-inbox/live-chat tools) ----
  { slug: "crisp", domains: ["help_desk"] },
  { slug: "freshdesk", domains: ["help_desk"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "front", domains: ["help_desk"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "gorgias", domains: ["help_desk"] },
  { slug: "happyfox", domains: ["help_desk"] },
  { slug: "help-scout", domains: ["help_desk"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "intercom", domains: ["help_desk"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "kayako", domains: ["help_desk"] },
  { slug: "liveagent", domains: ["help_desk"] },
  { slug: "reamaze", domains: ["help_desk"] },
  { slug: "tidio", domains: ["help_desk"] },
  { slug: "zendesk", domains: ["help_desk"] },
  // Genuine multi-domain: data/software/zoho-desk.json explicitly lists "24/7 branded self-service
  // help center with knowledge base and community" as its own feature — unlike freshdesk/intercom,
  // which were also audited in the 2026-08-21 integrity patch and kept help_desk-only because their
  // stored feature lists document no comparable knowledge-base capability.
  { slug: "zoho-desk", domains: ["help_desk", "knowledge_base"] },

  // ---- password_manager (from category: security — the security category also holds SSO/IAM/cloud-security/DevSecOps tools that are NOT password managers, deliberately excluded: auth0, cloudflare, crowdstrike, duo-security, okta, snyk, tailscale, wiz) ----
  { slug: "1password", domains: ["password_manager"] },
  { slug: "bitwarden", domains: ["password_manager"] },
  { slug: "dashlane", domains: ["password_manager"] },
  { slug: "keeper-security", domains: ["password_manager"] },
  { slug: "keeper", domains: ["password_manager"] },
  { slug: "lastpass", domains: ["password_manager"] },
  { slug: "nordpass", domains: ["password_manager"] },

  // ---- email_marketing (from category: marketing — excludes SEO tools (ahrefs, moz, semrush), call/lead-attribution tools (callrail, whatconverts, ruler-analytics), social media tools (buffer, hootsuite, later, sprout-social — their own domain below), and enterprise CDP/engagement platforms whose primary evidence is broader than email (braze, marketo-engage)) ----
  { slug: "activecampaign", domains: ["email_marketing"] },
  { slug: "brevo", domains: ["email_marketing"] },
  { slug: "constant-contact", domains: ["email_marketing"] },
  { slug: "getresponse", domains: ["email_marketing"] },
  { slug: "klaviyo", domains: ["email_marketing"] },
  { slug: "mailchimp", domains: ["email_marketing"] },
  { slug: "moosend", domains: ["email_marketing"] },

  // ---- accounting (category: accounting, 5 products) ----
  { slug: "freshbooks", domains: ["accounting"] },
  { slug: "quickbooks-online", domains: ["accounting"] },
  { slug: "wave", domains: ["accounting"] },
  { slug: "xero", domains: ["accounting"] },
  { slug: "zoho-books", domains: ["accounting"] },

  // ---- scheduling (category: scheduling, 10 products) ----
  { slug: "acuity-scheduling", domains: ["scheduling"] },
  { slug: "cal-com", domains: ["scheduling"] },
  { slug: "calendly", domains: ["scheduling"] },
  { slug: "doodle", domains: ["scheduling"] },
  { slug: "microsoft-bookings", domains: ["scheduling"] },
  { slug: "motion", domains: ["scheduling"] },
  { slug: "reclaim-ai", domains: ["scheduling"] },
  { slug: "savvycal", domains: ["scheduling"] },
  { slug: "setmore", domains: ["scheduling"] },
  { slug: "youcanbookme", domains: ["scheduling"] },

  // ---- analytics (from category: analytics — excludes volza, which is trade/customs shipment intelligence, not web/product analytics, despite sharing the category tag) ----
  { slug: "adobe-analytics", domains: ["analytics"] },
  { slug: "amplitude", domains: ["analytics"] },
  { slug: "crazy-egg", domains: ["analytics"] },
  { slug: "fathom-analytics", domains: ["analytics"] },
  { slug: "fullstory", domains: ["analytics"] },
  { slug: "google-analytics", domains: ["analytics"] },
  { slug: "heap", domains: ["analytics"] },
  { slug: "hotjar", domains: ["analytics"] },
  { slug: "matomo", domains: ["analytics"] },
  { slug: "mixpanel", domains: ["analytics"] },
  { slug: "plausible", domains: ["analytics"] },
  { slug: "posthog", domains: ["analytics"] },
  { slug: "segment", domains: ["analytics"] },

  // ---- social_media (from category: marketing — the 4 real social-media-management tools in that category) ----
  { slug: "buffer", domains: ["social_media"] }, // protected-cohort product — referenced here, page content untouched
  { slug: "hootsuite", domains: ["social_media"] },
  { slug: "later", domains: ["social_media"] },
  { slug: "sprout-social", domains: ["social_media"] },

  // ---- time_tracking (from category: productivity — the 5 real time-tracking tools in that category; excludes the note-taking/task-management products also filed under productivity: airtable, anydo, coda, craft, evernote, microsoft-onenote, notion, superhuman, things, ticktick, todoist) ----
  { slug: "clockify", domains: ["time_tracking"] },
  { slug: "harvest", domains: ["time_tracking"] },
  { slug: "hubstaff", domains: ["time_tracking"] },
  { slug: "time-doctor", domains: ["time_tracking"] },
  { slug: "toggl-track", domains: ["time_tracking"] },
];

const PROFILE_BY_SLUG = new Map(PRODUCT_PROFILES.map((p) => [p.slug, p]));

export function getProductProfile(slug: string): ProductProfile | undefined {
  return PROFILE_BY_SLUG.get(slug);
}

export function isEligibleForDomain(slug: string, domain: RecommendDomain): boolean {
  return getProductProfile(slug)?.domains.includes(domain) ?? false;
}

export function getSlugsForDomain(domain: RecommendDomain): string[] {
  return PRODUCT_PROFILES.filter((p) => p.domains.includes(domain)).map((p) => p.slug);
}
