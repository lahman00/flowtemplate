import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { setNetworkStatus, getNetworkStatus, readNetworkStatuses } from "@/lib/revenue/affiliate-network-status";

const NETWORK_PATH = path.join(process.cwd(), "var", "agents", "affiliate-network-status.json");

// Same backup/restore discipline as tests/lib/affiliate-pipeline.test.ts —
// this file holds the real, owner-submitted PartnerStack Network Profile
// status and must never be permanently wiped by a test run.
let realBackup: string | null = null;
let realBlobToken: string | undefined;

beforeAll(() => {
  realBackup = fs.existsSync(NETWORK_PATH) ? fs.readFileSync(NETWORK_PATH, "utf-8") : null;
  realBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

beforeEach(() => {
  fs.rmSync(NETWORK_PATH, { force: true });
});

afterAll(() => {
  if (realBackup !== null) {
    fs.mkdirSync(path.dirname(NETWORK_PATH), { recursive: true });
    fs.writeFileSync(NETWORK_PATH, realBackup);
  } else {
    fs.rmSync(NETWORK_PATH, { force: true });
  }
  if (realBlobToken !== undefined) process.env.BLOB_READ_WRITE_TOKEN = realBlobToken;
});

describe("affiliate network status", () => {
  it("returns undefined for a network with no recorded relationship", async () => {
    expect(await getNetworkStatus("Awin")).toBeUndefined();
  });

  it("records a submission and sets submittedAt once", async () => {
    const first = await setNetworkStatus("PartnerStack", "pending_review", { note: "Network Profile submitted." });
    expect(first.status).toBe("pending_review");
    expect(first.submittedAt).not.toBeNull();

    const submittedAt = first.submittedAt;
    const second = await setNetworkStatus("PartnerStack", "pending_review", { note: "still pending" });
    expect(second.submittedAt).toBe(submittedAt); // doesn't overwrite the original submission timestamp
  });

  it("does not create duplicate entries for the same network", async () => {
    await setNetworkStatus("PartnerStack", "pending_review");
    await setNetworkStatus("PartnerStack", "approved");
    const all = (await readNetworkStatuses()).filter((e) => e.network === "PartnerStack");
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe("approved");
    expect(all[0].approvedAt).not.toBeNull();
  });

  it("appends every status change to history", async () => {
    await setNetworkStatus("PartnerStack", "pending_review", { note: "submitted" });
    await setNetworkStatus("PartnerStack", "approved", { note: "approved by PartnerStack" });
    const entry = await getNetworkStatus("PartnerStack");
    expect(entry?.history).toHaveLength(2);
    expect(entry?.history[1].status).toBe("approved");
  });

  it("records rejection with a timestamp", async () => {
    await setNetworkStatus("Awin", "pending_review");
    const rejected = await setNetworkStatus("Awin", "rejected", { note: "declined" });
    expect(rejected.rejectedAt).not.toBeNull();
  });
});
