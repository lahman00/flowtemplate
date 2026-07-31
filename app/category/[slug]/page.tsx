import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeading } from "@/components/SectionHeading";
import { SoftwareCard } from "@/components/SoftwareCard";
import { JsonLd } from "@/components/JsonLd";
import { getAllCategories, getCategory } from "@/data/categories";
import { getSoftware } from "@/data/software";
import { getSoftwareByCategory } from "@/lib/related";
import { getBreadcrumbJsonLd, getCategoryJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return {
      title: "Category not found",
    };
  }

  const softwareCount = getSoftwareByCategory(category.slug).length;

  return {
    title: category.name,
    description: `${category.description} Compare ${softwareCount} ${category.name.toLowerCase()} tools.`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const software = getSoftwareByCategory(category.slug);
  const categorySlugs = new Set(software.map((item) => item.slug));
  const comparisons = PUBLISHED_COMPARISONS.filter(
    ([slugA, slugB]) => categorySlugs.has(slugA) || categorySlugs.has(slugB)
  )
    .map(([slugA, slugB]) => {
      const softwareA = getSoftware(slugA);
      const softwareB = getSoftware(slugB);
      return softwareA && softwareB ? { softwareA, softwareB } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: category.name, url: `${SITE_URL}/category/${category.slug}` },
        ])}
      />
      <JsonLd data={getCategoryJsonLd(category, software)} />

      <Container>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: category.name }]} />

        <header className="mt-6 max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <LayoutGrid className="h-5 w-5" strokeWidth={2.25} />
          </span>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {category.name}
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">{category.description}</p>
        </header>

        <section className="mt-14">
          <SectionHeading
            title={`${software.length} ${software.length === 1 ? "tool" : "tools"} in this category`}
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {software.map((item) => (
              <SoftwareCard key={item.slug} software={item} />
            ))}
          </div>
        </section>

        {comparisons.length > 0 ? (
          <section className="mt-14">
            <SectionHeading eyebrow="Head-to-head" title="Comparisons in this category" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {comparisons.map(({ softwareA, softwareB }) => (
                <Link
                  key={getComparisonSlug(softwareA.slug, softwareB.slug)}
                  href={`/compare/${getComparisonSlug(softwareA.slug, softwareB.slug)}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
                >
                  {softwareA.name} vs {softwareB.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
