"use server";

import { revalidatePath } from "next/cache";
import { fastTrackToSubmitted, fastTrackToApproved, setPipelineStatus } from "@/lib/revenue/affiliate-pipeline";

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

/**
 * PartnerStack Application Sprint (2026-08-14) — records a specific,
 * real blocker (CAPTCHA, legal acceptance, personal info, etc.) instead
 * of a generic status flip. `slug` is bound via .bind(null, slug); the
 * `reason` comes from the sprint form's own text input, since it has to
 * describe what was actually encountered on that program's real
 * application page, not a canned message.
 */
export async function markNeedsOwnerActionAction(slug: string, formData: FormData): Promise<void> {
  const reason = formData.get("reason");
  await setPipelineStatus(slug, "needs_owner_action", {
    ownerActionRequired: typeof reason === "string" && reason.trim() ? reason.trim() : "See notes.",
    note: typeof reason === "string" && reason.trim() ? reason.trim() : undefined,
  });
  revalidatePath("/internal/affiliate-pipeline");
}

/**
 * The real "Mark approved" path (2026-08-14) — requires the actual
 * affiliate/referral URL the program issued on approval, since an
 * "approved" status with no recorded link leaves nothing for
 * lib/affiliate.ts's CTA resolver to activate. `slug` is bound via
 * .bind(null, slug); `affiliateUrl` and optional `notes` come from the
 * dashboard's own approval form. Chains through any skipped intermediate
 * states via fastTrackToApproved so the audit trail stays honest even
 * when (as with Airtable) the real-world approval happened before this
 * pipeline ever tracked the application.
 */
export async function markApprovedWithUrlAction(slug: string, formData: FormData): Promise<void> {
  const affiliateUrl = formData.get("affiliateUrl");
  const notes = formData.get("notes");
  if (typeof affiliateUrl !== "string" || !affiliateUrl.trim()) {
    throw new Error("An affiliate URL is required to mark a program approved.");
  }
  await fastTrackToApproved(slug, {
    affiliateUrl: affiliateUrl.trim(),
    note: typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
  });
  revalidatePath("/internal/affiliate-pipeline");
}
