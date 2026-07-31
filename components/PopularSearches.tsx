import Link from "next/link";

export function PopularSearches({ items }: { items: Array<{ name: string; slug: string }> }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/software/${item.slug}`}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:border-white/30 hover:text-white"
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
