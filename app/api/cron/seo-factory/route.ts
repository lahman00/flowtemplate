import { NextResponse, type NextRequest } from "next/server";
import { runSeoFactory } from "@/lib/seo-factory/run";
import { claimSeoFactoryRun, readLatestSeoFactoryRun, releaseSeoFactoryRunClaim } from "@/lib/seo-factory/store";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const day = new Date().toISOString().slice(0, 10);
  if (!(await claimSeoFactoryRun(day))) {
    const latest = await readLatestSeoFactoryRun();
    return NextResponse.json({ ok: true, duplicateSkipped: true, latestRunId: latest?.id ?? null });
  }

  try {
    const run = await runSeoFactory();
    console.info("SEO Factory completed", {
      runId: run.id,
      gscRowsAnalyzed: run.gscRowsAnalyzed,
      pagesAnalyzed: run.pagesAnalyzed,
      opportunities: run.opportunities.length,
      actionCounts: run.actionCounts,
      autonomyLevel: run.autonomyLevel,
      massPublishingEnabled: run.massPublishingEnabled,
    });
    return NextResponse.json({ ok: true, runId: run.id, gscRowsAnalyzed: run.gscRowsAnalyzed, pagesAnalyzed: run.pagesAnalyzed, opportunities: run.opportunities.length, autonomyLevel: 0, massPublishingEnabled: false });
  } catch (error) {
    await releaseSeoFactoryRunClaim(day);
    const message = error instanceof Error ? error.message : "SEO Factory failed";
    console.error("SEO Factory failed", { message });
    return NextResponse.json({ ok: false, error: message, massPublishingEnabled: false }, { status: 503 });
  }
}
