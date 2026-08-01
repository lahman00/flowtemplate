/**
 * Sprint 12 Phase 2 — deterministic, dependency-free URL health checker.
 * Follows redirects manually (rather than trusting fetch's automatic
 * `redirect: "follow"`) so it can detect excessive redirect chains and
 * redirects that land on an unrelated domain — both real signals a
 * "verified" source URL may no longer be trustworthy.
 */

export type LinkCheckOutcome =
  | "ok"
  | "not_found"
  | "gone"
  | "client_error"
  | "server_error"
  | "redirect_chain_too_long"
  | "cross_domain_redirect"
  | "connection_failure"
  | "invalid_url"
  | "timeout";

export type LinkCheckResult = {
  url: string;
  outcome: LinkCheckOutcome;
  finalUrl?: string;
  httpStatus?: number;
  redirectHops: number;
  redirectChain: string[];
  checkedAt: string;
  details?: string;
};

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 10_000;

function hostnamesMatch(a: string, b: string): boolean {
  const stripWww = (host: string) => host.replace(/^www\./, "");
  return stripWww(a) === stripWww(b);
}

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FlowtemplateMaintenanceBot/1.0; +https://flowtemplate.app)",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkUrl(rawUrl: string): Promise<LinkCheckResult> {
  const checkedAt = new Date().toISOString();

  let originUrl: URL;
  try {
    originUrl = new URL(rawUrl);
  } catch {
    return {
      url: rawUrl,
      outcome: "invalid_url",
      redirectHops: 0,
      redirectChain: [],
      checkedAt,
      details: "URL failed to parse.",
    };
  }

  const chain: string[] = [rawUrl];
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let response: Response;

    try {
      response = await fetchOnce(currentUrl);
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      return {
        url: rawUrl,
        outcome: isAbort ? "timeout" : "connection_failure",
        redirectHops: hop,
        redirectChain: chain,
        checkedAt,
        details: error instanceof Error ? error.message : String(error),
      };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return {
          url: rawUrl,
          outcome: "server_error",
          httpStatus: response.status,
          redirectHops: hop,
          redirectChain: chain,
          checkedAt,
          details: "Redirect status with no Location header.",
        };
      }

      const nextUrl = new URL(location, currentUrl).toString();

      if (hop >= MAX_REDIRECTS) {
        return {
          url: rawUrl,
          outcome: "redirect_chain_too_long",
          redirectHops: hop + 1,
          redirectChain: chain,
          checkedAt,
          details: `Exceeded ${MAX_REDIRECTS} redirects.`,
        };
      }

      let nextHost: string;
      try {
        nextHost = new URL(nextUrl).hostname;
      } catch {
        return {
          url: rawUrl,
          outcome: "invalid_url",
          redirectHops: hop + 1,
          redirectChain: chain,
          checkedAt,
          details: `Redirected to an unparseable URL: ${nextUrl}`,
        };
      }

      if (!hostnamesMatch(originUrl.hostname, nextHost) && hop === 0) {
        // Only flag a cross-domain redirect from the ORIGINAL domain — a
        // multi-hop redirect that stays within the target's own domain
        // family after the first hop is normal (e.g. vendor.com -> app.vendor.com).
        chain.push(nextUrl);
        return {
          url: rawUrl,
          outcome: "cross_domain_redirect",
          finalUrl: nextUrl,
          redirectHops: hop + 1,
          redirectChain: chain,
          checkedAt,
          details: `${originUrl.hostname} redirected to ${nextHost}.`,
        };
      }

      chain.push(nextUrl);
      currentUrl = nextUrl;
      continue;
    }

    if (response.status === 404) {
      return { url: rawUrl, outcome: "not_found", httpStatus: 404, redirectHops: hop, redirectChain: chain, checkedAt };
    }
    if (response.status === 410) {
      return { url: rawUrl, outcome: "gone", httpStatus: 410, redirectHops: hop, redirectChain: chain, checkedAt };
    }
    if (response.status >= 400 && response.status < 500) {
      return {
        url: rawUrl,
        outcome: "client_error",
        httpStatus: response.status,
        redirectHops: hop,
        redirectChain: chain,
        checkedAt,
      };
    }
    if (response.status >= 500) {
      return {
        url: rawUrl,
        outcome: "server_error",
        httpStatus: response.status,
        redirectHops: hop,
        redirectChain: chain,
        checkedAt,
      };
    }

    return {
      url: rawUrl,
      outcome: "ok",
      finalUrl: currentUrl,
      httpStatus: response.status,
      redirectHops: hop,
      redirectChain: chain,
      checkedAt,
    };
  }

  return {
    url: rawUrl,
    outcome: "redirect_chain_too_long",
    redirectHops: MAX_REDIRECTS + 1,
    redirectChain: chain,
    checkedAt,
  };
}

/** Runs checks with bounded concurrency — polite to the vendor sites being checked and avoids opening hundreds of sockets at once. */
export async function checkUrlsWithConcurrency(urls: string[], concurrency = 6): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = new Array(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const index = nextIndex++;
      results[index] = await checkUrl(urls[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
  return results;
}
