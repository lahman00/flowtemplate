"use client";

import { useState } from "react";
import { buttonClasses } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

/**
 * Affiliate Revenue Engine, Phase 7 — the actual mechanism behind the
 * dashboard's "Copy business description / promotion strategy / email /
 * website" actions. Deliberately just clipboard writes, nothing else: this
 * never submits a form or navigates anywhere on the owner's behalf.
 */
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS or permission denied) — silently no-op, the text is still visible to select manually.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(buttonClasses("ghost", "md", "min-h-0 px-3 py-1.5 text-xs"), "shrink-0")}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
