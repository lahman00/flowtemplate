import { execSync } from "node:child_process";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, RiskLevel } from "@/types/agents";

/**
 * Shared implementation for the four QA agents that wrap an existing npm
 * script (build/typecheck/lint/validate:data) rather than reimplementing
 * any check — these commands are the actual source of truth for
 * correctness; an agent re-deriving "is this valid TypeScript" from
 * scratch would be strictly worse than just running `tsc`.
 */
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
      const output = [error.stdout, error.stderr, error.message].filter(Boolean).join("\n").slice(0, 4000);
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
