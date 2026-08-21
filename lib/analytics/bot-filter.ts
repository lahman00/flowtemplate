/**
 * Aggressive server-side bot and crawler filter.
 * Filters automated search spiders, synthetic QA, Vercel health checks, and headless browsers.
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

export function isInternalOrSyntheticTraffic(headers: Headers): boolean {
  const userAgent = headers.get("user-agent") || "";
  if (isBotUserAgent(userAgent)) return true;

  if (headers.get("x-synthetic-qa") === "true") return true;
  if (headers.get("x-vercel-sc-headers")) return true;
  if (headers.get("x-vercel-cron")) return true;
  if (headers.get("purpose") === "prefetch") return true;
  if (headers.get("sec-purpose") === "prefetch") return true;
  if (headers.get("x-purpose") === "preview") return true;
  if (headers.get("x-middleware-prefetch") === "1") return true;
  if (headers.get("x-nextjs-prefetch") === "1") return true;

  return false;
}
