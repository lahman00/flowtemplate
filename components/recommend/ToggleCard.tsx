"use client";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToggleCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-20 w-full items-start gap-3 rounded-xl border px-5 py-4 text-left transition active:scale-[0.98]",
        selected
          ? "border-white bg-white text-zinc-950"
          : "border-white/15 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-zinc-950 text-white" : "bg-white text-zinc-950"
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className={cn("mt-0.5 block text-xs", selected ? "text-zinc-700" : "text-zinc-400")}>
          {description}
        </span>
      </span>
      {selected ? <Check className="mt-1 h-4 w-4 shrink-0" strokeWidth={2.5} /> : null}
    </button>
  );
}
