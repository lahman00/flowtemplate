/**
 * Aggressive server-side bot and crawler filter.
 * Filters automated search spiders, Vercel platform/health-check noise,
 * and headless browsers.
 *
 * Analytics Zero-Drop Production Proof Mega Mission (2026-08-21) — Phase
 * 3/4: this used to collapse two very different things into one silent
 * "drop, don't store" bucket: real crawler/bot noise, AND explicit
 * Miloosh QA traffic (the old `x-synthetic-qa` header check). That's
 * architecturally wrong — Miloosh's own QA traffic (marked via the
 * `?qa=1` client-side flow, see lib/analytics/synthetic.ts) must be
 * STORED with isTest:true so the pipeline's own correctness can be
 * proven in production, and only actual bots/platform noise should be
 * discarded outright. classifyRequest() below replaces the old boolean
 * isInternalOrSyntheticTraffic with a reasoned classification so a
 * reviewer (or a live Vercel log line) can see exactly which check
 * fired, instead of a single opaque true/false.
 */

const KNOWN_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /bytespider/i,
  /mj12bot/i,
  /petalbot/i,
  /dotbot/i,
  /rogerbot/i,
  /exabot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /slackbot/i,
  /telegrambot/i,
  /whatsapp/i,
  /discordbot/i,
  /applebot/i,
  /redditbot/i,
  /pinterest/i,
  /skypeuripreview/i,
  /quora link preview/i,
  /embedly/i,
  /outbrain/i,
  /flipboard/i,
  /yeti/i,
  /ia_archiver/i,
  /archive\.org_bot/i,
  /screaming frog/i,
  /lighthouse/i,
  /headlesschrome/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /cypress/i,
  /phantomjs/i,
  /webdriver/i,
  /testcafe/i,
  /k6\b/i,
  /artillery/i,
  /jmeter/i,
  /locust/i,
  /vercel/i,
  /nextjs/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /urllib/i,
  /node-fetch/i,
  /axios/i,
  /got\//i,
  /undici/i,
  /superagent/i,
  /go-http-client/i,
  /postmanruntime/i,
  /insomnia/i,
  /httpclient/i,
  /libwww-perl/i,
  /uptime/i,
  /pingdom/i,
  /datadog/i,
  /newrelic/i,
  /synthetics/i,
  /better uptime/i,
  /site24x7/i,
  /statuscake/i,
  /uptimerobot/i,
  /bot\b/i,
  /spider\b/i,
  /crawler\b/i
];

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || typeof userAgent !== "string" || userAgent.trim().length === 0) {
    return true; // Reject empty user-agents as automated
  }

  return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** The three outcomes a request can be classified into before body validation runs. */
export type RequestClassificationKind = "BOT" | "INTERNAL_INFRA" | "PASS";

export type RequestClassification = {
  kind: RequestClassificationKind;
  /** Which specific check fired, for logging — never returned to the public client. */
  reason: string;
};

/**
 * Replaces the old boolean isInternalOrSyntheticTraffic. BOT and
 * INTERNAL_INFRA are kept as separate kinds (rather than one bucket)
 * specifically so a Vercel log line or a debug response can say which one
 * fired — this is what let the 2026-08-21 investigation actually find the
 * real cause of the production event drop instead of guessing.
 *
 * Deliberately does NOT check any `x-synthetic-qa`-style header anymore:
 * explicit Miloosh QA traffic is marked via the request BODY's isTest
 * field (set by lib/analytics/synthetic.ts's ?qa=1 flow) and must reach
 * storage, not be discarded here alongside real bots.
 *
 * Also deliberately does NOT check `x-vercel-sc-headers` anymore. Root
 * cause of the 2026-08-21 zero-events incident: this header is injected
 * by Vercel's own platform on requests reaching this function — proven
 * with a real production log line, `[analytics] INTERNAL_INFRA:
 * x-vercel-sc-headers header present`, produced by an ordinary curl POST
 * with a genuine browser user-agent and nothing else unusual about it.
 * Its mere presence is not a bot signal; treating it as one had been
 * silently discarding effectively all analytics traffic — real and
 * synthetic alike — since this check was added.
 */
export function classifyRequest(headers: Headers): RequestClassification {
  const userAgent = headers.get("user-agent") || "";
  if (isBotUserAgent(userAgent)) {
    return { kind: "BOT", reason: `user-agent matched a known bot pattern: "${userAgent.slice(0, 120)}"` };
  }

  const infraChecks: Array<[string, boolean]> = [
    ["x-vercel-cron header present", Boolean(headers.get("x-vercel-cron"))],
    ["purpose: prefetch", headers.get("purpose") === "prefetch"],
    ["sec-purpose: prefetch", headers.get("sec-purpose") === "prefetch"],
    ["x-purpose: preview", headers.get("x-purpose") === "preview"],
    ["x-middleware-prefetch: 1", headers.get("x-middleware-prefetch") === "1"],
    ["x-nextjs-prefetch: 1", headers.get("x-nextjs-prefetch") === "1"],
  ];
  const tripped = infraChecks.find(([, matched]) => matched);
  if (tripped) {
    return { kind: "INTERNAL_INFRA", reason: tripped[0] };
  }

  return { kind: "PASS", reason: "no bot/infra signal matched" };
}

/** @deprecated Use classifyRequest — kept only so existing tests can assert the old boolean shape still holds. */
export function isInternalOrSyntheticTraffic(headers: Headers): boolean {
  return classifyRequest(headers).kind !== "PASS";
}
