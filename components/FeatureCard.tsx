import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Card } from "@/components/Card";

export function FeatureCard({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: ComponentType<LucideProps>;
  step?: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        {step ? <span className="text-sm font-semibold text-zinc-600">{step}</span> : null}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 leading-6 text-zinc-400">{description}</p>
    </Card>
  );
}
