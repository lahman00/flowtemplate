import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * First-party privacy-respecting analytics event definitions and storage.
 *
 * Privacy model:
 * - NO names or emails.
 * - NO IP addresses stored in events.
 * - NO browser fingerprinting.
 * - Anonymous, ephemeral client-generated visitor ID (`visitorId`) and session ID (`sessionId`).
 * - Storage: Private Vercel Blob object per event or local fallback.
 */

export type FirstPartyEventType =
  | "page_view"
  | "engaged_view"
  | "software_view"
  | "comparison_view"
  | "recommend_use"
  | "outbound_click";

export interface BaseAnalyticsEvent {
  type: FirstPartyEventType;
  visitorId: string;
  sessionId: string;
  timestamp: string;
  path: string;
  isTest?: boolean;
}

export interface PageViewEvent extends BaseAnalyticsEvent {
  type: "page_view";
  referrer?: string;
}

export interface EngagedViewEvent extends BaseAnalyticsEvent {
  type: "engaged_view";
  durationSeconds: number;
}

export interface SoftwareViewEvent extends BaseAnalyticsEvent {
  type: "software_view";
  softwareSlug: string;
}

export interface ComparisonViewEvent extends BaseAnalyticsEvent {
  type: "comparison_view";
  comparisonSlug: string;
}

export interface RecommendUseEvent extends BaseAnalyticsEvent {
  type: "recommend_use";
  queryOrCategory?: string;
}

export interface OutboundClickEvent extends BaseAnalyticsEvent {
  type: "outbound_click";
  softwareSlug: string;
  destination: "official" | "affiliate";
  url: string;
  ctaLocation?: string;
  isTest?: boolean;
}

export type FirstPartyEvent =
  | PageViewEvent
  | EngagedViewEvent
  | SoftwareViewEvent
  | ComparisonViewEvent
  | RecommendUseEvent
  | OutboundClickEvent;

const BLOB_PREFIX = "first-party-analytics/";
const LOCAL_FALLBACK_PATH = path.join(process.cwd(), "var", "first-party-analytics.json");
const MAX_STORED_EVENTS = 10000;

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readLocalFallback(): FirstPartyEvent[] {
  try {
    const contents = fs.readFileSync(LOCAL_FALLBACK_PATH, "utf-8");
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as FirstPartyEvent[]) : [];
  } catch {
    return [];
  }
}

function appendLocalFallback(event: FirstPartyEvent): void {
  const events = readLocalFallback();
  events.push(event);
  fs.mkdirSync(path.dirname(LOCAL_FALLBACK_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(events.slice(-MAX_STORED_EVENTS), null, 2));
}

export async function recordFirstPartyEvent(event: FirstPartyEvent): Promise<void> {
  if (!hasBlobToken()) {
    try {
      appendLocalFallback(event);
    } catch {
      // ignore local write error
    }
    return;
  }

  try {
    const { put } = await import("@vercel/blob");
    const datePrefix = event.timestamp.slice(0, 10); // YYYY-MM-DD
    await put(`${BLOB_PREFIX}${datePrefix}/${randomUUID()}.json`, JSON.stringify(event), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  } catch {
    // transient blob store error
  }
}

export async function getAllFirstPartyEvents(): Promise<FirstPartyEvent[]> {
  const events: FirstPartyEvent[] = [];

  if (!hasBlobToken()) {
    return [...readLocalFallback()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  try {
    const { list, get } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PREFIX, limit: MAX_STORED_EVENTS });

    const results = await Promise.all(
      blobs.map(async (blob): Promise<FirstPartyEvent | null> => {
        try {
          const res = await get(blob.pathname, { access: "private", useCache: false });
          if (!res) return null;
          const text = await new Response(res.stream).text();
          return JSON.parse(text) as FirstPartyEvent;
        } catch {
          return null;
        }
      })
    );

    for (const r of results) {
      if (r) events.push(r);
    }
  } catch {
    // fallback or empty
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
