import { NextResponse } from "next/server";
import { getLinkedInTransport, verifyBufferLinkedInTarget } from "@/lib/social/channels/linkedin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const verification = await verifyBufferLinkedInTarget();
    return NextResponse.json({ transport: getLinkedInTransport(), ...verification });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Buffer verification failed" }, { status: 502 });
  }
}
