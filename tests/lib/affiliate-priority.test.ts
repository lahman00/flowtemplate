import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import { getAffiliatePriority, getRankedApplicationCandidates, getAllPriorities } from "@/lib/revenue/affiliate-priority";
import { readAffiliatePipeline, type AffiliatePipelineEntry } from "@/lib/revenue/affiliate-pipeline";
import { getSoftware, getAllSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";

/** Counts real reads of the local pipeline fallback file — the same file the production Blob store mirrors. Works regardless of internal call structure, so it directly catches a regression back to the N+1 pattern (2026-08-15 operations incident) rather than just asserting on mock call counts of an internal function. */
function countPipelineFileReads(spy: ReturnType<typeof vi.spyOn>): number {
  return spy.mock.calls.filter((call: unknown[]) => String(call[0]).includes("affiliate-pipeline.json")).length;
}

describe("affiliate priority scoring", () => {
  it("produces a score within the documented 0-100 range for every product", async () => {
    for (const software of getAllSoftware()) {
      const breakdown = await getAffiliatePriority(software);
      expect(breakdown.totalScore).toBeGreaterThanOrEqual(0);
      expect(breakdown.totalScore).toBeLessThanOrEqual(100);
    }
  });

  it("scores a confirmed program's availability at the maximum", async () => {
    const clickup = getSoftware("clickup")!;
    const breakdown = await getAffiliatePriority(clickup);
    expect(breakdown.programExists).toBe("yes");
    expect(breakdown.affiliateAvailabilityScore).toBe(10);
  });

  it("scores a product with no research entry at all as no_entry / 0 availability", async () => {
    const untouched = getAllSoftware().find((s) => !AFFILIATE_PROGRAMS.some((p) => p.slug === s.slug));
    expect(untouched).toBeDefined();
    const breakdown = await getAffiliatePriority(untouched!);
    expect(breakdown.programExists).toBe("no_entry");
    expect(breakdown.affiliateAvailabilityScore).toBe(0);
  });

  it("gives PartnerStack programs the highest approval-friction ease score", async () => {
    const clickup = getSoftware("clickup")!; // confirmed PartnerStack program
    const breakdown = await getAffiliatePriority(clickup);
    expect(breakdown.approvalFrictionScore).toBe(10);
  });

  it("labels traffic score honestly as 'none' when no real GSC cohort data exists for a slug", async () => {
    const zoom = getSoftware("zoom");
    if (zoom) {
      const breakdown = await getAffiliatePriority(zoom);
      if (breakdown.trafficOpportunityScore === 0) {
        expect(breakdown.trafficDataSource).toBe("none");
      }
    }
  });

  it("excludes a program with a real, evidenced closure (Doodle) from confirmed programs", async () => {
    const doodle = AFFILIATE_PROGRAMS.find((p) => p.slug === "doodle");
    expect(doodle?.programExists).toBe("no");
  });

  it("getRankedApplicationCandidates only includes confirmed ('yes') programs", async () => {
    const ranked = await getRankedApplicationCandidates();
    expect(ranked.length).toBeGreaterThan(0);
    for (const r of ranked) {
      expect(r.programExists).toBe("yes");
    }
  });

  it("getRankedApplicationCandidates is sorted highest score first", async () => {
    const ranked = await getRankedApplicationCandidates();
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].totalScore).toBeGreaterThanOrEqual(ranked[i].totalScore);
    }
  });

  it("getAllPriorities covers every software product exactly once", async () => {
    const all = await getAllPriorities();
    expect(all).toHaveLength(getAllSoftware().length);
    const slugs = new Set(all.map((a) => a.slug));
    expect(slugs.size).toBe(all.length);
  });
});

/**
 * Regression coverage for the 2026-08-15 Vercel Blob operations incident:
 * getRankedApplicationCandidates()/getAllPriorities() used to call
 * getAffiliatePriority() per product, and getAffiliatePriority() called
 * getPipelineEntry() (a full readAffiliatePipeline() read) internally —
 * ~217 separate full-file reads for one dashboard page load, enough to
 * exhaust the Hobby plan's 10K-operation limit in under a day. These
 * tests fail if that pattern comes back, regardless of how it's
 * reintroduced, because they watch the actual filesystem read count
 * (fs.readFileSync) rather than asserting on a specific call site.
 */
describe("affiliate priority — pipeline read efficiency (must not scale with catalog size)", () => {
  it("catalog is large enough that an N+1 regression here would be caught (sanity check)", () => {
    expect(getAllSoftware().length).toBeGreaterThan(50);
  });

  it("getRankedApplicationCandidates reads the pipeline file at most once when no entries are passed", async () => {
    const readSpy = vi.spyOn(fs, "readFileSync");
    await getRankedApplicationCandidates();
    const pipelineReads = countPipelineFileReads(readSpy);
    readSpy.mockRestore();
    expect(pipelineReads).toBeLessThanOrEqual(1);
  });

  it("getAllPriorities reads the pipeline file at most once when no entries are passed", async () => {
    const readSpy = vi.spyOn(fs, "readFileSync");
    await getAllPriorities();
    const pipelineReads = countPipelineFileReads(readSpy);
    readSpy.mockRestore();
    expect(pipelineReads).toBeLessThanOrEqual(1);
  });

  it("passing a pre-fetched entries array makes zero additional pipeline reads for either ranking function", async () => {
    const entries = await readAffiliatePipeline();
    const readSpy = vi.spyOn(fs, "readFileSync");
    await getRankedApplicationCandidates(entries);
    await getAllPriorities(entries);
    const pipelineReads = countPipelineFileReads(readSpy);
    readSpy.mockRestore();
    expect(pipelineReads).toBe(0);
  });

  it("a single call to either ranking function never reads the pipeline file more times than there are software products (would only fail under an N+1 regression)", async () => {
    const catalogSize = getAllSoftware().length;
    const readSpy = vi.spyOn(fs, "readFileSync");
    await getRankedApplicationCandidates();
    const pipelineReads = countPipelineFileReads(readSpy);
    readSpy.mockRestore();
    expect(pipelineReads).toBeLessThan(catalogSize);
  });

  it("the entries passed into getRankedApplicationCandidates are actually used, not silently ignored", async () => {
    const clickup = getSoftware("clickup")!;
    const fakeEntries: AffiliatePipelineEntry[] = [
      {
        slug: clickup.slug,
        status: "approved",
        ownerActionRequired: null,
        submittedAt: null,
        approvedAt: "2026-01-01T00:00:00.000Z",
        rejectedAt: null,
        affiliateUrl: "https://example.com/ref/fake",
        trackingId: null,
        notes: "regression-test fixture",
        history: [],
      },
    ];
    const ranked = await getRankedApplicationCandidates(fakeEntries);
    const entry = ranked.find((r) => r.slug === clickup.slug);
    expect(entry?.pipelineStatus).toBe("approved");
    expect(entry?.affiliateUrl).toBe("https://example.com/ref/fake");
  });
});
