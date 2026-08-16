import type { PublishResult } from "@/lib/social/types";

/**
 * Bounded retry for exactly one class of failure: RATE_LIMITED. That's
 * the one status an adapter returns where retrying is actually the
 * correct response (the request was valid, the platform just asked to
 * wait) — SETUP_REQUIRED, MANUAL_ONLY, and DUPLICATE_SKIPPED are not
 * transient, and a generic FAILED (auth error, malformed request, 4xx)
 * retrying won't fix either, so this deliberately doesn't guess at
 * retrying those. One retry, one fixed short backoff — simple enough to
 * be predictable in a serverless cron invocation with its own timeout.
 */
const MAX_ATTEMPTS = 2;
const BACKOFF_MS = 1500;

export async function publishWithRetry(publish: () => Promise<PublishResult>, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): Promise<PublishResult> {
  let last: PublishResult | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await publish();
    if (result.status !== "RATE_LIMITED" || attempt === MAX_ATTEMPTS) return result;
    last = result;
    await sleep(BACKOFF_MS);
  }
  return last!;
}
