import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { SITE_URL } from "@/lib/site";
import { submitUrlsToIndexNow } from "@/scripts/agents/seo/lib/indexnow-client";
import { readState, writeState, unsubmittedToIndexNow, recordIndexNowSubmission } from "@/lib/agents/state";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * The one agent in this system that performs a real external write
 * (notifying search engines a URL exists) rather than only observing.
 * Justified as Level 1, not Level 4: IndexNow submission is a standard,
 * expected webmaster action — functionally the same idea as a sitemap
 * ping, at the scale of "this specific page," using a protocol
 * (indexnow.org) whose entire design point is "call this whenever a page
 * is new or changed." It is not spam, not fake engagement, not paid,
 * and not irreversible — it's a notification, not a mutation.
 *
 * "Do not repeatedly submit unchanged URLs" (brief Section G's own
 * IndexNow instruction) is enforced by var/agents/state.json's
 * `indexNowSubmittedAt` map: a URL is submitted at most once, ever,
 * unless that map is cleared. This agent is the one exception to "agents
 * are pure functions reporting findings" — it reads and writes state
 * itself (readState/writeState) rather than going through the
 * orchestrator's centralized dedupeKey-based state update, because
 * "which URLs have I already told the world about" is exactly the kind
 * of side-effect a single agent, not the generic orchestrator, should own.
 *
 * First run submits every current real URL (all of them are "new" to
 * IndexNow); every run after that submits only URLs that didn't exist
 * last time. There's no content-change detection yet (that would need
 * hashing each page's content, not built here) — only "is this URL
 * new since we started tracking," which is what the brief's "unchanged
 * URLs" concern is actually about (repeatedly blasting the same static
 * set on a timer).
 */

function buildAllRealUrls(): string[] {
  const software = getAllSoftware();
  const categories = getAllCategories();
  const staticPaths = ["/", "/about", "/contact", "/recommend", "/compare"];
  const categoryPaths = categories.map((c) => `/category/${c.slug}`);
  const softwarePaths = software.map((s) => `/software/${s.slug}`);
  const comparisonPaths = [...PUBLISHED_COMPARISONS].map(([a, b]) => `/compare/${getComparisonSlug(a, b)}`);
  return [...staticPaths, ...categoryPaths, ...softwarePaths, ...comparisonPaths].map((p) => `${SITE_URL}${p}`);
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-indexnow-submit";
  const state = readState();
  const allUrls = buildAllRealUrls();
  const newUrls = unsubmittedToIndexNow(state, allUrls);

  if (newUrls.length === 0) {
    return { summary: "No URLs are new since the last IndexNow submission — nothing to send.", findings: [] };
  }

  const result = await submitUrlsToIndexNow(newUrls, SITE_URL);

  if (result.ok) {
    writeState(recordIndexNowSubmission(state, newUrls));
  }

  const findings = result.ok
    ? []
    : [
        makeFinding({
          agentId,
          kind: "issue",
          severity: "warning",
          title: `IndexNow submission failed: HTTP ${result.status}`,
          description: `Submitting ${newUrls.length} new URL(s) to IndexNow returned HTTP ${result.status} — ${result.detail}`,
          location: null,
          evidence: [`status=${result.status}`, result.detail],
          confidence: 1,
          riskLevel: 1,
          recommendedAction: result.status === 403 ? `Verify ${SITE_URL}<key>.txt is live and matches the key this agent submitted.` : "Review the IndexNow API response.",
          dedupeKey: `${agentId}:failed:${result.status}`,
        }),
      ];

  return {
    summary: result.ok
      ? `Submitted ${newUrls.length} new URL(s) to IndexNow (HTTP ${result.status} — ${result.detail}). ${allUrls.length - newUrls.length} already submitted previously, skipped.`
      : `Attempted to submit ${newUrls.length} new URL(s) to IndexNow; failed.`,
    findings,
  };
};
