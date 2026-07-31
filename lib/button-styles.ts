import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-white text-zinc-950 hover:bg-zinc-200 shadow-lg shadow-white/10",
  secondary:
    "border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25",
  ghost: "text-zinc-400 hover:bg-white/5 hover:text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-12 px-6 text-sm",
  lg: "min-h-14 px-8 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
) {
  return cn(base, variantStyles[variant], sizeStyles[size], className);
}
