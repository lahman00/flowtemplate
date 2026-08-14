"use server";

import { revalidatePath } from "next/cache";
import { fastTrackToSubmitted, setPipelineStatus } from "@/lib/revenue/affiliate-pipeline";

/**
 * Affiliate Revenue Engine, Completion Pass (2026-08-14) — the actual
 * write path behind the dashboard's status buttons. Bound to a slug via
 * `.bind(null, slug)` and passed straight to a <form action>, so no
 * client component is needed for this. Every call goes through the same
 * setPipelineStatus() state machine the CLI uses — invalid transitions
 * still throw, this just gives the dashboard a one-click way to reach the
 * common ones instead of requiring a terminal.
 */

export async function markSubmittedAction(slug: string): Promise<void> {
  await fastTrackToSubmitted(slug);
  revalidatePath("/internal/affiliate-pipeline");
}

export async function markApprovedAction(slug: string): Promise<void> {
  await setPipelineStatus(slug, "approved");
  revalidatePath("/internal/affiliate-pipeline");
}

export async function markRejectedAction(slug: string): Promise<void> {
  await setPipelineStatus(slug, "rejected");
  revalidatePath("/internal/affiliate-pipeline");
}
