"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OptionButton({
  selected,
  onClick,
  title,
  description,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-14 w-full rounded-xl border px-5 py-3 text-left transition active:scale-[0.98]",
        selected
          ? "border-white bg-white text-zinc-950"
          : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
        className
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {description ? (
        <span className={cn("mt-0.5 block text-xs", selected ? "text-zinc-700" : "text-zinc-400")}>
          {description}
        </span>
      ) : null}
    </button>
  );
}
