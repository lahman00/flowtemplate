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
  /screaming frog/i,
  /lighthouse/i,
  /headlesschrome/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /vercel/i,
  /nextjs/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /node-fetch/i,
  /axios/i,
  /go-http-client/i,
  /postmanruntime/i,
  /insomnia/i,
  /uptime/i,
  /pingdom/i,
  /datadog/i,
  /newrelic/i,
  /synthetics/i,
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
  if (headers.get("purpose") === "prefetch") return true;
  if (headers.get("sec-purpose") === "prefetch") return true;

  return false;
}
