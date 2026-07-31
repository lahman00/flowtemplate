import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, GitCompare } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/SectionHeading";
import { SearchForm } from "@/components/SearchForm";
import { JsonLd } from "@/components/JsonLd";
import { getSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { getCategoryName } from "@/data/categories";
import { getBreadcrumbJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare software",
  description:
    "Side-by-side comparisons of popular software tools — features, platforms, and positioning sourced from each vendor's own site.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  const comparisons = PUBLISHED_COMPARISONS.map(([slugA, slugB]) => {
    const softwareA = getSoftware(slugA);
    const softwareB = getSoftware(slugB);
    return softwareA && softwareB ? { softwareA, softwareB } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Compare", url: `${SITE_URL}/compare` },
        ])}
      />

      <Container>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Compare" }]} />

        <header className="mt-6 max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <GitCompare className="h-5 w-5" strokeWidth={2.25} />
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Compare software
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">
            A curated set of head-to-head comparisons — not every possible pair, just the ones
            people actually search for. Every fact comes from each vendor&apos;s own official
            site.
          </p>
        </header>

        <section className="mt-14">
          <SectionHeading
            title={`${comparisons.length} comparisons`}
            description="Pick a pair below to see a full side-by-side breakdown."
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map(({ softwareA, softwareB }) => (
              <Link
                key={getComparisonSlug(softwareA.slug, softwareB.slug)}
                href={`/compare/${getComparisonSlug(softwareA.slug, softwareB.slug)}`}
                className="group block h-full"
              >
                <Card className="flex h-full flex-col group-hover:border-white/25 group-hover:bg-white/[0.05]">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {getCategoryName(softwareA.category) === getCategoryName(softwareB.category)
                        ? getCategoryName(softwareA.category)
                        : `${getCategoryName(softwareA.category)} · ${getCategoryName(softwareB.category)}`}
                    </p>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-600 transition group-hover:text-white" />
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {softwareA.name} vs {softwareB.name}
                  </h3>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-14 text-center">
          <SectionHeading
            align="center"
            title="Comparing something else?"
            description="Search any software by name to see its alternatives."
          />
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchForm />
          </div>
        </section>
      </Container>
    </main>
  );
}
