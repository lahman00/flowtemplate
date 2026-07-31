import { Sparkles, Megaphone } from "lucide-react";
import type { Software } from "@/data/software";
import { isFeatured, isSponsored } from "@/lib/monetization";

/**
 * Renders "Sponsored" / "Featured" labels only when a listing actually is
 * one — never rendered today, since no entry sets either flag. Built ready
 * for when a real sponsorship or featured placement exists.
 */
export function ListingBadges({ software }: { software: Software }) {
  if (!isSponsored(software) && !isFeatured(software)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isSponsored(software) ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400">
          <Megaphone className="h-3 w-3" />
          Sponsored
        </span>
      ) : null}
      {isFeatured(software) ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-400">
          <Sparkles className="h-3 w-3" />
          Featured
        </span>
      ) : null}
    </div>
  );
}
