import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Card } from "@/components/Card";
import { SectionHeading } from "@/components/SectionHeading";
import { getCategoryName } from "@/data/categories";
import { getSoftware } from "@/data/software";
import type { AlternativeGuide } from "@/data/seo/alternative-guides";

export function AlternativeDecisionGuide({ guide, category }: { guide: AlternativeGuide; category: string }) {
  return (
    <section className="mt-14" aria-labelledby="alternative-decision-heading">
      <SectionHeading eyebrow="Decision guide" title={<span id="alternative-decision-heading">{guide.heading}</span>} description={guide.introduction} />
      <Card className="mt-8">
        <div className="flex items-center gap-3"><Compass className="h-5 w-5 text-zinc-300" /><h3 className="text-lg font-semibold text-white">Why consider another option?</h3></div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">{guide.whySeekAlternative.map((reason) => <li key={reason} className="text-sm leading-6 text-zinc-400">{reason}</li>)}</ul>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {guide.decisions.map((decision) => {
          const alternative = getSoftware(decision.alternativeSlug);
          if (!alternative) return null;
          return <Card key={decision.heading} className="flex h-full flex-col"><h3 className="text-lg font-semibold text-white">{decision.heading}</h3><p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{decision.fit}</p><div className="mt-5 space-y-2 text-sm"><Link className="flex items-center justify-between text-zinc-200 underline underline-offset-4 hover:text-white" href={`/software/${alternative.slug}`}>Explore {alternative.name}<ArrowRight className="h-4 w-4" /></Link><Link className="flex items-center justify-between text-zinc-400 underline underline-offset-4 hover:text-white" href={`/compare/${decision.comparisonSlug}`}>Open comparison<ArrowRight className="h-4 w-4" /></Link></div></Card>;
        })}
      </div>
      <p className="mt-6 text-sm text-zinc-400">See the wider <Link href={`/category/${category}`} className="text-white underline underline-offset-4">{getCategoryName(category)}</Link> category for more Miloosh-covered options.</p>
    </section>
  );
}
