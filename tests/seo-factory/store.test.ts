import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { readLatestSeoFactoryRun, readSeoExperiments, recordSeoExperiment, writeSeoFactoryRun } from "@/lib/seo-factory/store";
import type { SeoExperiment, SeoFactoryRun } from "@/lib/seo-factory/types";

const latestPath = path.join(process.cwd(), "var", "agents", "seo-factory-latest.json");
const experimentsPath = path.join(process.cwd(), "var", "agents", "seo-factory-experiments.json");
const backups = new Map<string, string | null>();
let blobToken: string | undefined;

beforeAll(() => {
  blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  for (const file of [latestPath, experimentsPath]) backups.set(file, fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : null);
});
beforeEach(() => { for (const file of [latestPath, experimentsPath]) fs.rmSync(file, { force: true }); });
afterAll(() => {
  for (const [file, backup] of backups) {
    if (backup === null) fs.rmSync(file, { force: true });
    else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, backup); }
  }
  if (blobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = blobToken;
});

const run = { schemaVersion: 1, id: "run-1", generatedAt: "2026-08-20T00:00:00Z", window: { startDate: "2026-07-01", endDate: "2026-07-28" }, autonomyLevel: 0, massPublishingEnabled: false, gscRowsAnalyzed: 10, pagesAnalyzed: 3, inventory: { software: 1, comparisons: 1, categories: 1, total: 3 }, comparisonDiagnosis: { pagesWithVisibility: 0, impressions: 0, clicks: 0, medianPosition: null }, actionCounts: { CREATE: 0, IMPROVE: 0, MERGE: 0, REDIRECT: 0, INTERNAL_LINK: 0, META_TEST: 0, REFRESH: 0, MONETIZE: 0, WAIT: 0, IGNORE: 0 }, intentCounts: { SOFTWARE_BRAND: 0, PRICING: 0, COMPARISON: 0, ALTERNATIVES: 0, REVIEW: 0, FEATURE: 0, INTEGRATION: 0, MIGRATION: 0, USE_CASE: 0, CATEGORY: 0, DECISION: 0, SUPPORT_HOW_TO: 0, UNKNOWN: 0 }, leaveAloneCount: 0, opportunities: [], errors: [] } satisfies SeoFactoryRun;

function experiment(id: string, recordedAt: string, decision: SeoExperiment["decision"] = "MEASURING"): SeoExperiment {
  return { id, page: "/software/pipedrive", intervention: "title test", recordedAt, reason: "CTR gap", baseline: { impressions: 100, clicks: 1, ctr: 0.01, position: 8 }, measurementWindowDays: 28, result: null, decision };
}

describe("SEO Factory durable state contract", () => {
  it("round-trips the latest analysis with mass publishing disabled", async () => {
    await writeSeoFactoryRun(run);
    expect(await readLatestSeoFactoryRun()).toEqual(run);
    expect((await readLatestSeoFactoryRun())?.massPublishingEnabled).toBe(false);
  });

  it("does not start a second experiment while the same page is measuring", async () => {
    expect((await recordSeoExperiment(experiment("one", "2026-08-01T00:00:00Z"))).recorded).toBe(true);
    expect((await recordSeoExperiment(experiment("two", "2026-09-15T00:00:00Z"))).recorded).toBe(false);
    expect(await readSeoExperiments()).toHaveLength(1);
  });
});
