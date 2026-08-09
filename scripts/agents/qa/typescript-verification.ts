import { makeShellCheckAgent } from "@/scripts/agents/qa/shell-check";

export const run = makeShellCheckAgent({
  agentId: "qa-typescript-verification",
  command: "npx tsc --noEmit",
  label: "TypeScript check",
  timeoutMs: 60_000,
  riskLevel: 1,
});
