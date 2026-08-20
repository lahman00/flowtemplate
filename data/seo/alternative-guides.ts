export type AlternativeDecision = {
  heading: string;
  fit: string;
  alternativeSlug: string;
  comparisonSlug: string;
};

export type AlternativeGuide = {
  diagnosis: string;
  heading: string;
  introduction: string;
  whySeekAlternative: string[];
  decisions: AlternativeDecision[];
  evidenceSources: string[];
};

export const ALTERNATIVE_GUIDES: Record<string, AlternativeGuide> = {
  pipedrive: {
    diagnosis: "The existing page names only two broad CRM alternatives and does not route sales teams through the pipeline, automation, and suite-depth decisions reflected in Pipedrive's current plans.",
    heading: "Choose a Pipedrive alternative by sales workflow",
    introduction: "Pipedrive centers the sales process on a visual deal pipeline. A different CRM becomes relevant when the buying decision is really about starting cost, wider marketing and service coverage, or a more configurable operating model—not simply replacing one pipeline screen with another.",
    whySeekAlternative: ["A team wants CRM, marketing, and service tools in one product family.", "The sales process needs a different balance of automation, reporting, and customization.", "A smaller team wants to compare the total plan and add-on structure before migrating data."],
    decisions: [
      { heading: "Broader go-to-market suite", fit: "HubSpot is the relevant Miloosh-covered option when the evaluation includes marketing and service tools alongside CRM.", alternativeSlug: "hubspot", comparisonSlug: "hubspot-vs-pipedrive" },
      { heading: "Sales-first CRM with a different operating model", fit: "Freshsales is worth comparing when the requirement remains sales-focused but the team wants another approach to automation and customer context.", alternativeSlug: "freshsales", comparisonSlug: "pipedrive-vs-freshsales" },
      { heading: "Customization across a wider CRM stack", fit: "Zoho CRM is the decision path for teams evaluating a broader suite and a different customization model.", alternativeSlug: "zoho-crm", comparisonSlug: "pipedrive-vs-zoho-crm" },
    ],
    evidenceSources: ["https://www.pipedrive.com/en/pricing", "https://www.pipedrive.com/en/features"],
  },
  airtable: {
    diagnosis: "The page lists three alternatives but does not explain when a buyer needs an app-building database, a document workspace, or a task-first work-management system.",
    heading: "Start with the system you are trying to build",
    introduction: "Airtable combines relational data, interfaces, automations, and app building. The useful alternatives question is therefore structural: does the team need a database-backed application, a document-centered workspace, or a dedicated system for managing project execution?",
    whySeekAlternative: ["The primary work happens in documents and knowledge pages rather than connected records.", "The team needs task ownership and delivery views more than a configurable data layer.", "Seat pricing, scale, permissions, and automation limits change the fit as usage grows."],
    decisions: [
      { heading: "Documents and knowledge with databases", fit: "Notion is the relevant path when pages, wikis, and documentation are as important as structured data.", alternativeSlug: "notion", comparisonSlug: "airtable-vs-notion" },
      { heading: "Task and project execution", fit: "ClickUp fits evaluations centered on assigned work, timelines, and project delivery rather than building an internal app.", alternativeSlug: "clickup", comparisonSlug: "clickup-vs-airtable" },
      { heading: "Visual work management", fit: "Monday.com is a credible comparison when teams want board-led workflows, dashboards, and automations without Airtable's database emphasis.", alternativeSlug: "monday", comparisonSlug: "monday-vs-airtable" },
    ],
    evidenceSources: ["https://airtable.com/pricing", "https://www.airtable.com/platform"],
  },
  semrush: {
    diagnosis: "The page compresses a broad SEO and digital-marketing platform into two alternatives, leaving specialist SEO, first-party analytics, and social workflows undifferentiated.",
    heading: "Decide which part of Semrush you actually need",
    introduction: "Semrush spans SEO research, site auditing, competitive analysis, content, advertising, social, local, and AI-search visibility. Buyers looking for an alternative should first separate an all-in-one marketing suite decision from a specialist SEO-data, web-analytics, or social-management decision.",
    whySeekAlternative: ["The team needs deep SEO research without the wider marketing toolkit.", "The requirement is measurement of owned-site behavior rather than competitor and search research.", "A dedicated social publishing or listening workflow matters more than an SEO-centered suite."],
    decisions: [
      { heading: "Specialist SEO research", fit: "Ahrefs is the closest Miloosh-covered route when backlink, keyword, and organic-search research are the core job.", alternativeSlug: "ahrefs", comparisonSlug: "semrush-vs-ahrefs" },
      { heading: "Owned-site analytics", fit: "Google Analytics addresses traffic and conversion measurement; it is complementary in many stacks, so compare the job rather than assuming feature equivalence.", alternativeSlug: "google-analytics", comparisonSlug: "semrush-vs-google-analytics" },
      { heading: "Social intelligence and management", fit: "Sprout Social is relevant when publishing, engagement, listening, and social analytics are the primary requirement.", alternativeSlug: "sprout-social", comparisonSlug: "semrush-vs-sprout-social" },
    ],
    evidenceSources: ["https://www.semrush.com/pricing/", "https://www.semrush.com/features/"],
  },
  freshdesk: {
    diagnosis: "The page emphasizes AI but does not separate core ticketing from omnichannel, ecommerce-specialist, and AI-led support choices across its comparison inventory.",
    heading: "Match the alternative to the support operation",
    introduction: "Freshdesk's current plans combine ticketing, a shared inbox, self-service, analytics, routing, and optional AI capabilities. An alternative should be evaluated against the support model: enterprise service operations, conversational AI, a simpler shared inbox, or ecommerce-specific customer context.",
    whySeekAlternative: ["The team needs a different balance between ticketing depth and conversational support.", "AI-agent or copilot costs must be evaluated separately from core agent seats.", "Ecommerce order context or cross-team collaboration is central to resolution work."],
    decisions: [
      { heading: "Broader service operations", fit: "Zendesk is the relevant comparison for organizations evaluating wider omnichannel and service-management capability.", alternativeSlug: "zendesk", comparisonSlug: "freshdesk-vs-zendesk" },
      { heading: "AI-led conversational support", fit: "Intercom is the path when an integrated AI agent and messenger-led support model drive the decision.", alternativeSlug: "intercom", comparisonSlug: "freshdesk-vs-intercom" },
      { heading: "Simpler shared-inbox workflow", fit: "Help Scout is useful for teams prioritizing an inbox, knowledge base, and straightforward collaboration model.", alternativeSlug: "help-scout", comparisonSlug: "freshdesk-vs-help-scout" },
    ],
    evidenceSources: ["https://www.freshworks.com/freshdesk/pricing/", "https://www.freshworks.com/freshdesk/features/"],
  },
  buffer: {
    diagnosis: "The current two-option section does not answer the recurring free-alternative queries or distinguish lightweight publishing from enterprise social intelligence.",
    heading: "Choose by social workflow, not feature count",
    introduction: "Buffer is positioned around creating, scheduling, publishing, engagement, and analytics across social channels. The alternative decision changes depending on whether the buyer wants a lightweight publishing workflow, deeper listening and reporting, or a broader enterprise management layer.",
    whySeekAlternative: ["The number of channels, users, or approval steps changes the plan fit.", "Listening, competitive intelligence, and advanced reporting outweigh publishing simplicity.", "The team needs a different collaboration model for agencies or larger brand operations."],
    decisions: [
      { heading: "Enterprise social management", fit: "Hootsuite is the relevant comparison for wider account management, monitoring, and enterprise workflows.", alternativeSlug: "hootsuite", comparisonSlug: "buffer-vs-hootsuite" },
      { heading: "Social intelligence and listening", fit: "Sprout Social fits evaluations where listening, analytics, and structured engagement operations lead the purchase.", alternativeSlug: "sprout-social", comparisonSlug: "buffer-vs-sprout-social" },
      { heading: "Campaign automation beyond social", fit: "ActiveCampaign is relevant only when the real requirement extends into email and customer-journey automation; it is not a direct scheduler substitute.", alternativeSlug: "activecampaign", comparisonSlug: "activecampaign-vs-buffer" },
    ],
    evidenceSources: ["https://buffer.com/pricing", "https://buffer.com"],
  },
  ringcentral: {
    diagnosis: "The current alternatives lean toward meetings and collaboration even though the query cluster is a business-phone and communications-platform decision.",
    heading: "Separate business calling from team collaboration",
    introduction: "RingCentral's RingEX offering combines business calling, messaging, video, and AI assistance, with contact-center and receptionist products alongside it. Alternatives should be compared against the exact communications layer being replaced: phone system, Microsoft-centered collaboration, or meeting platform.",
    whySeekAlternative: ["The business primarily needs a cloud phone system rather than a full communications suite.", "Microsoft 365 integration defines the collaboration environment.", "Video meetings and webinars matter more than telephony administration."],
    decisions: [
      { heading: "Cloud phone system focus", fit: "KrispCall is the Miloosh-covered comparison when calling, numbers, and phone workflows are the central requirement.", alternativeSlug: "krispcall", comparisonSlug: "krispcall-vs-ringcentral" },
      { heading: "Microsoft-centered collaboration", fit: "Microsoft Teams is relevant when chat, meetings, files, and Microsoft 365 integration shape the decision.", alternativeSlug: "microsoft-teams", comparisonSlug: "microsoft-teams-vs-ringcentral" },
      { heading: "Meetings plus enterprise collaboration", fit: "Webex provides another calling, messaging, meetings, and webinar path for organizations comparing unified communications stacks.", alternativeSlug: "webex", comparisonSlug: "ringcentral-vs-webex" },
    ],
    evidenceSources: ["https://www.ringcentral.com/office/plansandpricing.html"],
  },
  "help-scout": {
    diagnosis: "The page lists only Front and Crisp and lacks the pricing and operating-model context needed to compare a shared inbox with AI-led or ticketing-heavy support platforms.",
    heading: "Choose the support model before the vendor",
    introduction: "Help Scout combines shared inboxes, customer channels, knowledge bases, automation, reporting, and separately priced AI Answers. A credible alternative depends on whether the team wants simpler inbox collaboration, AI-agent-led conversations, or more formal ticketing and routing depth.",
    whySeekAlternative: ["Support volume requires more advanced routing, SLAs, or service administration.", "An AI agent is intended to lead the customer interaction rather than complement the inbox.", "Cross-functional teams need customer communication to move beyond a support-owned queue."],
    decisions: [
      { heading: "AI-agent-led support", fit: "Intercom is the relevant path when Fin and messenger-based automation are central to the service design.", alternativeSlug: "intercom", comparisonSlug: "help-scout-vs-intercom" },
      { heading: "Cross-team customer operations", fit: "Front is a stronger comparison when support, operations, sales, and account teams share ownership of customer communication.", alternativeSlug: "front", comparisonSlug: "front-vs-help-scout" },
      { heading: "Traditional helpdesk depth", fit: "Freshdesk fits evaluations that prioritize ticketing, routing, portals, and broader helpdesk administration.", alternativeSlug: "freshdesk", comparisonSlug: "freshdesk-vs-help-scout" },
    ],
    evidenceSources: ["https://www.helpscout.com/pricing/"],
  },
  intercom: {
    diagnosis: "Forty-two query variants map to the correct page, but the current two alternatives do not cover the distinct AI-agent, conventional helpdesk, and cross-team operations choices.",
    heading: "Compare Intercom by service architecture",
    introduction: "Intercom pairs its helpdesk with Fin, an integrated AI agent. The alternative decision is clearest when buyers decide whether AI should lead resolution, whether a conventional ticketing platform should remain central, or whether customer communication belongs in a cross-team operational inbox.",
    whySeekAlternative: ["The organization wants a ticketing-led service stack rather than an AI-agent-first model.", "A smaller support team values a simpler inbox and knowledge-base setup.", "Customer conversations require collaboration across support, sales, and operations."],
    decisions: [
      { heading: "Ticketing-led enterprise service", fit: "Zendesk is the relevant route for broader ticketing, service administration, and contact-center evaluation.", alternativeSlug: "zendesk", comparisonSlug: "intercom-vs-zendesk" },
      { heading: "Simpler support-team workflow", fit: "Help Scout fits teams that prioritize a shared inbox, Docs, and a less expansive service platform.", alternativeSlug: "help-scout", comparisonSlug: "help-scout-vs-intercom" },
      { heading: "Cross-functional customer operations", fit: "Front is the comparison for organizations where multiple business teams jointly manage external communication.", alternativeSlug: "front", comparisonSlug: "front-vs-intercom" },
    ],
    evidenceSources: ["https://www.intercom.com/pricing", "https://www.intercom.com/helpdesk"],
  },
  front: {
    diagnosis: "Almost all page visibility comes from alternatives queries, yet the current two-option section does not distinguish shared inbox, helpdesk, AI-agent, and ecommerce-support decisions.",
    heading: "Identify who owns the customer conversation",
    introduction: "Front combines shared inboxes, ticketing, workflow automation, and AI for customer operations. Its alternatives become clearer when ownership is defined: a dedicated support team, an AI-led conversational service, or a traditional helpdesk with structured routing and portals.",
    whySeekAlternative: ["Customer communication belongs mainly to a dedicated support function rather than several teams.", "The desired workflow begins with an AI agent or embedded messenger.", "Formal ticket routing, self-service, and service administration matter more than email-style collaboration."],
    decisions: [
      { heading: "Support-owned shared inbox", fit: "Help Scout is the relevant comparison for teams seeking a focused support inbox, knowledge base, and customer messaging toolkit.", alternativeSlug: "help-scout", comparisonSlug: "front-vs-help-scout" },
      { heading: "AI-led conversational service", fit: "Intercom fits evaluations centered on an integrated AI agent and messenger-based customer support.", alternativeSlug: "intercom", comparisonSlug: "front-vs-intercom" },
      { heading: "Structured helpdesk operations", fit: "Freshdesk is the route when ticketing, routing, portals, and helpdesk administration are the core requirements.", alternativeSlug: "freshdesk", comparisonSlug: "freshdesk-vs-front" },
    ],
    evidenceSources: ["https://front.com/pricing", "https://front.com/product"],
  },
};

export function getAlternativeGuide(slug: string): AlternativeGuide | undefined {
  return ALTERNATIVE_GUIDES[slug];
}
