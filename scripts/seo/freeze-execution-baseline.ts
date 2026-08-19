import { captureExecutionBaselines } from "@/lib/seo-factory/baseline";
import { runSeoFactory } from "@/lib/seo-factory/run";

async function main() {
  const run = await runSeoFactory();
  const baselines = await captureExecutionBaselines(run);
  console.log(JSON.stringify({ runId: run.id, capturedAt: baselines[0]?.capturedAt, window: run.window, gscRows: run.gscRowsAnalyzed, baselineCount: baselines.length, baselineIds: baselines.map((item) => item.id) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
