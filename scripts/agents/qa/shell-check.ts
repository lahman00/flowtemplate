import { execSync } from "node:child_process";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, RiskLevel } from "@/types/agents";

/**
 * Shared implementation for the four QA agents that wrap an existing npm
 * script (build/typecheck/lint/validate:data) rather than reimplementing
 * any check — these commands are the actual source of truth for
 * correctness; an agent re-deriving "is this valid TypeScript" from
 * scratch would be strictly worse than just running `tsc`.
 *
 * Security note: raw tsc/eslint/npm output routinely includes the full
 * absolute filesystem path (e.g. `/Users/<name>/<project>/lib/foo.ts:12:3`)
 * — every file reference is resolved from `cwd`. Since this finding's
 * evidence is rendered on /internal/growth (public URL, protected only by
 * obscurity + robots — not authentication), that absolute path must never
 * reach the report. `sanitizeOutput` strips the repo root prefix from
 * every line before anything is captured, so only repo-relative paths
 * (already public — this repo is public on GitHub) ever appear, even if a
 * future build/lint/typecheck run fails.
 */

function sanitizeOutput(raw: string): string {
  const root = process.cwd();
  // Replace every absolute-path occurrence of the repo root with a
  // relative marker. Covers both bare occurrences and ones nested in a
  // longer path/URL-like string.
  return raw.split(root).join(".");
}

export function makeShellCheckAgent(config: {
  agentId: string;
  command: string;
  label: string;
  timeoutMs: number;
  riskLevel: RiskLevel;
}): AgentRunFn {
  return async () => {
    try {
      execSync(config.command, {
        cwd: process.cwd(),
        timeout: config.timeoutMs - 2000,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return {
        summary: `${config.label} passed.`,
        findings: [],
      };
    } catch (err) {
      const error = err as { stdout?: string; stderr?: string; message?: string };
      const rawOutput = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").slice(0, 4000);
      const output = sanitizeOutput(rawOutput);
      return {
        summary: `${config.label} failed.`,
        findings: [
          makeFinding({
            agentId: config.agentId,
            kind: "issue",
            severity: "critical",
            title: `${config.label} failed`,
            description: `Running \`${config.command}\` exited non-zero.`,
            location: null,
            evidence: [output || "No output captured."],
            confidence: 1,
            riskLevel: config.riskLevel,
            recommendedAction: `Fix the failure reported by \`${config.command}\` before deploying.`,
            dedupeKey: `${config.agentId}:failing`,
          }),
        ],
      };
    }
  };
}
