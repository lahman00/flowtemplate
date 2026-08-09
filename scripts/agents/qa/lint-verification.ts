import { makeShellCheckAgent } from "@/scripts/agents/qa/shell-check";

export const run = makeShellCheckAgent({
  agentId: "qa-lint-verification",
  command: "npm run lint",
  label: "Lint",
  timeoutMs: 60_000,
  riskLevel: 1,
});
