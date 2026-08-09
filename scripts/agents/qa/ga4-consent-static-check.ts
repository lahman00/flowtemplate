import { SITE_URL } from "@/lib/site";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Regression guard for the GA4 consent-mode implementation (see
 * components/GoogleAnalyticsConsent.tsx, lib/consent.ts). Checks only
 * what's verifiable from a single unauthenticated HTTP GET of the
 * pre-consent homepage HTML.
 *
 * IMPORTANT, discovered by actually running this against production
 * rather than assuming it would work: every `next/script` in this app
 * (both the always-present Consent Mode default script and the
 * conditionally-rendered real gtag.js) uses `strategy="afterInteractive"`,
 * which Next.js injects client-side AFTER hydration — it is NEVER present
 * as literal text in the server-rendered HTML, regardless of consent
 * state. A first version of this check looked for the default-consent
 * script's literal text in the HTML and always failed, which would have
 * been a permanent false positive, not a real signal. That check was
 * removed. What DOES remain genuinely checkable via plain HTTP: the real
 * gtag.js script only ever renders when `consent === "granted"`, and
 * server-side rendering always evaluates that to `false` (useSyncExternalStore's
 * getServerSnapshot returns "loading", never "granted") — so if the real
 * gtag.js URL ever appears in server HTML, that's a genuine, meaningful
 * regression (something bypassing the client-only gate entirely). This
 * agent checks exactly that one fact and nothing it can't actually verify.
 * See docs/agents-architecture.md "GA4 coverage gap" for what still
 * requires a real browser (the grant/decline/no-duplication flow) — that
 * was manually verified against production this session and is not
 * automated here.
 */
export const run: AgentRunFn = async () => {
  const agentId = "qa-ga4-consent-static-check";
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(10_000) });
    const html = await res.text();

    const findings = [];
    const hasRealGtagScript = /googletagmanager\.com\/gtag\/js/.test(html);
    if (hasRealGtagScript) {
      findings.push(
        makeFinding({
          agentId,
          kind: "regression",
          severity: "critical",
          title: "GA4 script present in pre-consent HTML",
          description: "The real gtag.js script tag was found in the server-rendered pre-consent homepage HTML. This means analytics may be loading before consent — a direct regression of the consent-gating implementation.",
          location: "/",
          evidence: ["Matched: googletagmanager.com/gtag/js in pre-consent HTML"],
          confidence: 1,
          riskLevel: 3,
          recommendedAction: "Investigate immediately — this is a privacy-posture regression, not just a bug.",
          dedupeKey: `${agentId}:gtag-present`,
        })
      );
    }

    return {
      summary: findings.length === 0 ? "GA4 pre-consent static check passed: no gtag.js script tag in server-rendered HTML (the only fact about this client-gated flow that's checkable via plain HTTP)." : `GA4 static check found ${findings.length} problem(s).`,
      findings,
    };
  } catch (err) {
    return {
      summary: "Could not fetch homepage for GA4 static check.",
      findings: [
        makeFinding({
          agentId,
          kind: "issue",
          severity: "warning",
          title: "GA4 static check could not run",
          description: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
          location: "/",
          evidence: [String(err)],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Retry — may be transient.",
          dedupeKey: `${agentId}:fetch-failed`,
        }),
      ],
    };
  }
};
