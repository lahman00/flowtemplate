import { makeShellCheckAgent } from "@/scripts/agents/qa/shell-check";

/** Slow (a full production build, ~1400 static pages) — daily/weekly/full modes only, not quick. */
export const run = makeShellCheckAgent({
  agentId: "qa-build-verification",
  command: "npm run build",
  label: "Production build",
  timeoutMs: 300_000,
  riskLevel: 1,
});
