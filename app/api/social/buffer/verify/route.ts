import { NextResponse } from "next/server";
import { getLinkedInTransport, verifyBufferLinkedInChannel } from "@/lib/social/channels/linkedin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const channel = await verifyBufferLinkedInChannel();
    return NextResponse.json({ transport: getLinkedInTransport(), channel });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Buffer verification failed" }, { status: 502 });
  }
}
