import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: ComponentType<LucideProps>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-white">{value}</p>
        <p className="mt-1 text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
