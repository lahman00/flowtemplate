import { execSync } from "node:child_process";

export interface DeploymentRecord {
  id: string;
  url: string;
  status: "Ready" | "Error" | "Building" | "Canceled" | "Unknown";
  environment: string;
  aliases: string[];
}

export function getLatestProductionDeployment(): DeploymentRecord {
  try {
    const rawOutput = execSync("vercel ls --prod", { encoding: "utf8" });
    const lines = rawOutput.split("\n").map(l => l.trim()).filter(Boolean);

    for (const url of lines) {
      if (!url.startsWith("https://flowtemplate-")) continue;

      try {
        const inspectRaw = execSync(`vercel inspect ${url} 2>&1`, { encoding: "utf8" });
        const cleanInspect = inspectRaw.replace(/[\u001b\x1b]\[[0-9;]*[a-zA-Z]/g, "");
        const idMatch = cleanInspect.match(/id\s+([a-zA-Z0-9_]+)/);
        const id = (idMatch && idMatch[1]) ? idMatch[1] : "";

        let status: DeploymentRecord["status"] = "Unknown";
        if (cleanInspect.includes("● Ready") || cleanInspect.includes("status\t● Ready")) status = "Ready";
        else if (cleanInspect.includes("● Error") || cleanInspect.includes("status\t● Error")) status = "Error";
        else if (cleanInspect.includes("● Building") || cleanInspect.includes("status\t● Building")) status = "Building";

        const aliasMatches = cleanInspect.match(/https:\/\/[a-zA-Z0-9\.\-]+/g) || [];
        const aliases = Array.from(new Set(aliasMatches.filter(a => a !== url)));

        // If this is the latest deployment, return it
        return {
          id,
          url,
          status,
          environment: "Production",
          aliases
        };
      } catch {
        // continue to next deployment
      }
    }
  } catch (err: unknown) {
    console.error("Failed to run vercel CLI:", (err as Error).message);
  }

  throw new Error("No production deployment record found in vercel ls --prod");
}

export async function verifyLiveDeployment(expectedCommit?: string) {
  console.log("================================================================");
  console.log("             MILOOSH VERCEL DEPLOYMENT GUARD                    ");
  console.log("================================================================\n");

  const currentLocalHead = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  const currentOriginHead = execSync("git rev-parse origin/main", { encoding: "utf8" }).trim();

  console.log(`Local HEAD:        ${currentLocalHead}`);
  console.log(`Origin/main HEAD:  ${currentOriginHead}`);
  if (expectedCommit) {
    console.log(`Expected Commit:   ${expectedCommit}`);
  }

  const deployment = getLatestProductionDeployment();
  console.log(`\nLatest Vercel Production Deployment:`);
  console.log(`  ID:          ${deployment.id}`);
  console.log(`  URL:         ${deployment.url}`);
  console.log(`  Status:      ${deployment.status}`);
  console.log(`  Environment: ${deployment.environment}`);
  console.log(`  Aliases:     ${deployment.aliases.join(", ")}`);

  if (deployment.status !== "Ready") {
    console.error(`\n❌ DEPLOYMENT FAILED: Latest production deployment status is ${deployment.status} (expected: Ready)`);
    process.exit(1);
  }

  // Verify direct deployment URL
  console.log(`\nVerifying direct deployment URL (${deployment.url})...`);
  try {
    const res = await fetch(deployment.url, { method: "HEAD", headers: { "User-Agent": "MilooshDeploymentGuard/1.0" } });
    if (res.status !== 200) {
      console.error(`❌ HTTP ${res.status} returned from direct deployment URL!`);
      process.exit(1);
    }
    console.log(`  ✓ Direct deployment URL returned HTTP 200`);
  } catch (err: unknown) {
    console.error(`❌ Failed to fetch direct deployment URL: ${(err as Error).message}`);
    process.exit(1);
  }

  // Verify canonical production domain
  console.log(`\nVerifying canonical production domain (https://miloosh.com)...`);
  try {
    const res = await fetch("https://miloosh.com", { method: "HEAD", headers: { "User-Agent": "MilooshDeploymentGuard/1.0" } });
    if (res.status !== 200) {
      console.error(`❌ HTTP ${res.status} returned from https://miloosh.com!`);
      process.exit(1);
    }
    console.log(`  ✓ Canonical production domain returned HTTP 200`);
  } catch (err: unknown) {
    console.error(`❌ Failed to fetch canonical domain: ${(err as Error).message}`);
    process.exit(1);
  }

  console.log(`\n================================================================`);
  console.log(`✅ DEPLOYMENT GUARD PASSED: Production is verified READY & LIVE`);
  console.log(`================================================================\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const expected = process.argv[2];
  verifyLiveDeployment(expected);
}
