import fs from "node:fs";
import path from "node:path";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Static source-code regression guard, complementing
 * qa-ga4-consent-static-check's live-HTTP check. Confirms the consent
 * files still exist and that components/Analytics.tsx's "ga" branch still
 * delegates to GoogleAnalyticsConsent rather than rendering raw
 * gtag.js Script tags directly (the pre-consent-mode implementation this
 * codebase deliberately moved away from — see docs/legal-and-trust.md
 * "GA4 consent mode"). A regression here is a real, checkable code fact,
 * not a guess.
 */

const REQUIRED_FILES = ["lib/consent.ts", "components/ConsentBanner.tsx", "components/GoogleAnalyticsConsent.tsx", "components/CookiePreferencesControl.tsx"];

export const run: AgentRunFn = async () => {
  const agentId = "qa-ga4-consent-code-audit";
  const root = process.cwd();
  const findings = [];

  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      findings.push(
        makeFinding({
          agentId,
          kind: "regression",
          severity: "critical",
          title: `Missing GA4 consent file: ${relativePath}`,
          description: `${relativePath} no longer exists. This is one of the four files that implement Consent Mode gating.`,
          location: relativePath,
          evidence: [`fs.existsSync(${relativePath}) === false`],
          confidence: 1,
          riskLevel: 3,
          recommendedAction: "Investigate immediately — do not deploy until restored or the removal is a deliberate, reviewed decision.",
          dedupeKey: `${agentId}:missing:${relativePath}`,
        })
      );
    }
  }

  const analyticsPath = path.join(root, "components/Analytics.tsx");
  if (fs.existsSync(analyticsPath)) {
    const source = fs.readFileSync(analyticsPath, "utf-8");
    const delegatesToConsent = source.includes("GoogleAnalyticsConsent");
    const rendersRawGtagScript = /googletagmanager\.com\/gtag\/js/.test(source);

    if (!delegatesToConsent || rendersRawGtagScript) {
      findings.push(
        makeFinding({
          agentId,
          kind: "regression",
          severity: "critical",
          title: "components/Analytics.tsx no longer delegates GA4 to the consent-gated component",
          description: `components/Analytics.tsx's "ga" branch ${delegatesToConsent ? "" : "no longer references GoogleAnalyticsConsent, and "}${rendersRawGtagScript ? "appears to render a raw gtag.js script tag directly" : ""}. This is the exact regression that would silently reintroduce always-on analytics.`,
          location: "components/Analytics.tsx",
          evidence: [`Contains "GoogleAnalyticsConsent": ${delegatesToConsent}`, `Contains raw gtag.js script src: ${rendersRawGtagScript}`],
          confidence: 1,
          riskLevel: 3,
          recommendedAction: "Investigate immediately before deploying — this is a privacy-posture regression.",
          dedupeKey: `${agentId}:analytics-delegation`,
        })
      );
    }
  }

  return {
    summary: findings.length === 0 ? "GA4 consent code audit passed: all files present, Analytics.tsx delegates correctly." : `GA4 consent code audit found ${findings.length} problem(s).`,
    findings,
  };
};
