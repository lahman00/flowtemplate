import { NextResponse, type NextRequest } from "next/server";
import { isInternalOrSyntheticTraffic } from "@/lib/analytics/bot-filter";
import { recordFirstPartyEvent, type FirstPartyEvent } from "@/lib/analytics/events";

export async function POST(request: NextRequest) {
  // Exclude bots, crawlers, and automated synthetic checks
  if (isInternalOrSyntheticTraffic(request.headers)) {
    return NextResponse.json({ recorded: false, reason: "bot_or_synthetic" });
  }

  let body: Partial<FirstPartyEvent>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ recorded: false, reason: "invalid_json" }, { status: 400 });
  }

  if (!body.type || !body.visitorId || !body.sessionId || !body.path) {
    return NextResponse.json({ recorded: false, reason: "missing_fields" }, { status: 400 });
  }

  const sanitizedEvent: FirstPartyEvent = {
    ...body,
    timestamp: new Date().toISOString(),
    path: String(body.path).slice(0, 300),
    visitorId: String(body.visitorId).slice(0, 64),
    sessionId: String(body.sessionId).slice(0, 64),
    // Recommend Engine Integrity Patch (2026-08-21): coerced to a strict
    // boolean rather than trusted as-is — see lib/analytics/synthetic.ts.
    isTest: body.isTest === true,
  } as FirstPartyEvent;

  await recordFirstPartyEvent(sanitizedEvent);

  return NextResponse.json({ recorded: true });
}
