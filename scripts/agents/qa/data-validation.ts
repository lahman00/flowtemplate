import { makeShellCheckAgent } from "@/scripts/agents/qa/shell-check";

export const run = makeShellCheckAgent({
  agentId: "qa-data-validation",
  command: "npm run validate:data",
  label: "Data validation",
  timeoutMs: 60_000,
  riskLevel: 1,
});
