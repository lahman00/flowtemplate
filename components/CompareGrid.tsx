"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { Card } from "@/components/Card";
import { getComparisonSlug } from "@/data/comparisons";

export type CompareGridItem = {
  slugA: string;
  nameA: string;
  slugB: string;
  nameB: string;
  categoryLabel: string;
};

/**
 * Content forensics (2026-08-10) flagged /compare as a single unfiltered
 * list of all 1,107 comparisons — real for crawlers (every link is a real
 * href, present in the server-rendered HTML at initial load, so nothing
 * here removes a single link Googlebot would otherwise see) but a weak
 * experience for a human visitor trying to find one specific pair. This
 * adds a client-side filter over the same static list; the full grid still
 * renders in the initial HTML (useState starts at ""), this only changes
 * what's visible after hydration as someone types.
 */
export function CompareGrid({ items }: { items: CompareGridItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.nameA.toLowerCase().includes(q) ||
        item.nameB.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          strokeWidth={2}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Filter by product or category, e.g. Notion or CRM"
          aria-label="Filter comparisons"
          className="min-h-14 w-full rounded-xl border border-white/15 bg-white/5 pl-12 pr-5 text-white outline-none placeholder:text-zinc-500 focus:border-accent focus:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <p className="mt-4 text-sm text-zinc-500" aria-live="polite">
        {query.trim() ? `${filtered.length} of ${items.length} comparisons match "${query.trim()}"` : `${items.length} comparisons`}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Link
            key={getComparisonSlug(item.slugA, item.slugB)}
            href={`/compare/${getComparisonSlug(item.slugA, item.slugB)}`}
            className="group block h-full"
          >
            <Card className="flex h-full flex-col group-hover:border-white/25 group-hover:bg-white/[0.05]">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{item.categoryLabel}</p>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-600 transition group-hover:text-white" />
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {item.nameA} vs {item.nameB}
              </h3>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          No comparisons match &ldquo;{query.trim()}&rdquo; — try a product or category name.
        </p>
      ) : null}
    </div>
  );
}
