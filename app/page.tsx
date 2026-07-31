import type { Metadata } from "next";
import {
  Sparkles,
  LayoutGrid,
  GitCompare,
  Layers,
  Search,
  Scale,
  CircleCheck,
  Compass,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { ButtonLink } from "@/components/ButtonLink";
import { SearchForm } from "@/components/SearchForm";
import { PopularSearches } from "@/components/PopularSearches";
import { StatItem } from "@/components/StatItem";
import { SectionHeading } from "@/components/SectionHeading";
import { FeatureCard } from "@/components/FeatureCard";
import { SoftwareCard } from "@/components/SoftwareCard";
import { CategoryCard } from "@/components/CategoryCard";
import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { getSoftwareByCategory } from "@/lib/related";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  const allSoftware = getAllSoftware();
  const allCategories = getAllCategories();

  const alternativeCount = new Set(
    allSoftware.flatMap((software) => software.alternatives.map((alternative) => alternative.slug))
  ).size;

  const categoryCount = new Set(allSoftware.map((software) => software.category)).size;

  const popularComparisons = PUBLISHED_COMPARISONS.slice(0, 6)
    .map(([slugA, slugB]) => {
      const softwareA = allSoftware.find((software) => software.slug === slugA);
      const softwareB = allSoftware.find((software) => software.slug === slugB);
      return softwareA && softwareB ? { softwareA, softwareB } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const stats = [
    { icon: LayoutGrid, value: String(allSoftware.length), label: "Tools covered" },
    { icon: GitCompare, value: `${alternativeCount}+`, label: "Alternatives compared" },
    { icon: Layers, value: String(categoryCount), label: "Categories" },
    { icon: Sparkles, value: "Free", label: "No signup required" },
  ];

  const steps = [
    {
      icon: Search,
      step: "01",
      title: "Search any tool",
      description:
        "Type the name of software you use today, or one you're thinking about switching from.",
    },
    {
      icon: Scale,
      step: "02",
      title: "Compare side-by-side",
      description:
        "See strengths, best-fit use cases, and what makes each alternative different.",
    },
    {
      icon: CircleCheck,
      step: "03",
      title: "Switch with confidence",
      description:
        "Pick the option that actually matches your workflow, team size, and budget.",
    },
  ];

  return (
    <main className="flex-1">
      <section id="search" className="relative scroll-mt-16 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[-10rem] -z-10 flex justify-center"
        >
          <div className="h-[30rem] w-[60rem] rounded-full bg-white/[0.06] blur-3xl" />
        </div>

        <Container className="flex flex-col items-center py-20 text-center sm:py-28 lg:py-32">
          <Badge>
            <Sparkles className="h-3.5 w-3.5" />
            Software alternatives made simple
          </Badge>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find the right software
            <span className="block text-zinc-400">before you switch.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Compare software alternatives, pricing, features, and migration options in one
            place — so you can switch with confidence.
          </p>

          <SearchForm className="mt-10 w-full max-w-2xl" />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-zinc-500">Popular:</span>
            <PopularSearches
              items={allSoftware.slice(0, 6).map((software) => ({
                name: software.name,
                slug: software.slug,
              }))}
            />
          </div>
        </Container>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <Container className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-4">
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <Card className="flex flex-col items-start gap-8 border-white/15 bg-white/[0.04] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
                <Compass className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Not sure where to start? Get matched.
              </h2>
              <p className="mt-3 leading-7 text-zinc-400">
                Answer a few questions about your team, budget, and what you need — our
                recommendation engine matches you against the verified dataset and explains every
                point of every score. No AI guessing, no invented facts.
              </p>
            </div>
            <ButtonLink href="/recommend" size="lg" className="w-full shrink-0 sm:w-auto">
              Find my software
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </Card>
        </Container>
      </section>

      <section id="how-it-works" className="scroll-mt-16 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to a better tool"
            description="No accounts, no spreadsheets — just a fast, honest comparison."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <FeatureCard key={step.title} {...step} />
            ))}
          </div>
        </Container>
      </section>

      <section id="categories" className="scroll-mt-16 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Categories"
            title="Browse by category"
            description="Every tool belongs to one category — start there if you know what kind of tool you need."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {allCategories.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                count={getSoftwareByCategory(category.slug).length}
              />
            ))}
          </div>
        </Container>
      </section>

      <section id="compare" className="scroll-mt-16 py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Compare"
              title="Popular head-to-head comparisons"
              description="Side-by-side breakdowns of the tools people compare most."
            />
            <Link
              href="/compare"
              className="hidden shrink-0 text-sm font-medium text-zinc-400 transition hover:text-white sm:block"
            >
              View all comparisons →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {popularComparisons.map(({ softwareA, softwareB }) => (
              <Link
                key={getComparisonSlug(softwareA.slug, softwareB.slug)}
                href={`/compare/${getComparisonSlug(softwareA.slug, softwareB.slug)}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-center text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.05]"
              >
                {softwareA.name} vs {softwareB.name}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section id="browse" className="scroll-mt-16 py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Browse"
            title="Start from a tool you already know"
            description="Pick a platform below to see its strongest alternatives."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allSoftware.map((software) => (
              <SoftwareCard key={software.slug} software={software} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] py-20 sm:py-28">
        <Container className="flex flex-col items-center text-center">
          <SectionHeading
            align="center"
            title="Don't see what you're looking for?"
            description="Search any software by name and we'll help you find the right alternative."
          />
          <SearchForm className="mt-10 w-full max-w-2xl" />
        </Container>
      </section>
    </main>
  );
}
