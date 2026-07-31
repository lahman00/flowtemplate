import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GitCompare, Scale } from "lucide-react";
import { Container } from "@/components/Container";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AlternativeCard } from "@/components/AlternativeCard";
import { SoftwareCard } from "@/components/SoftwareCard";
import { SearchForm } from "@/components/SearchForm";
import { SectionHeading } from "@/components/SectionHeading";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getAllSoftware, getSoftware } from "@/data/software";
import { getRelatedSoftware } from "@/lib/related";
import {
  generateComparisonIntro,
  generateFaq,
  generateH1,
  generateIntro,
  generateMetaDescription,
  generateTitle,
} from "@/lib/generators";
import {
  getBreadcrumbJsonLd,
  getFaqJsonLd,
  getSoftwareApplicationJsonLd,
} from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

type SoftwarePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getAllSoftware().map((software) => ({ slug: software.slug }));
}

export async function generateMetadata({ params }: SoftwarePageProps): Promise<Metadata> {
  const { slug } = await params;
  const software = getSoftware(slug);

  if (!software) {
    return {
      title: "Software not found",
    };
  }

  const title = generateTitle(software);
  const description = generateMetaDescription(software);

  return {
    title,
    description,
    alternates: { canonical: `/software/${slug}` },
    openGraph: {
      title,
      description,
    },
  };
}

export default async function SoftwarePage({ params }: SoftwarePageProps) {
  const { slug } = await params;
  const software = getSoftware(slug);

  if (!software) {
    notFound();
  }

  const relatedSoftware = getRelatedSoftware(software, 3);
  const faqItems = generateFaq(software);

  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: software.name, url: `${SITE_URL}/software/${software.slug}` },
        ])}
      />
      <JsonLd data={getSoftwareApplicationJsonLd(software)} />
      <JsonLd data={getFaqJsonLd(faqItems)} />

      <Container>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: software.name }]} />

        <header className="mt-6 max-w-3xl">
          <Badge>{software.category}</Badge>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {generateH1(software)}
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-400">{generateIntro(software)}</p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
            <GitCompare className="h-4 w-4" />
            {software.alternatives.length} alternatives compared
          </div>
        </header>

        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading title="Top alternatives" description={generateComparisonIntro(software)} />

            <span className="hidden shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 sm:block">
              {software.alternatives.length} options
            </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {software.alternatives.map((alternative, index) => (
              <AlternativeCard key={alternative.slug} alternative={alternative} rank={index + 1} />
            ))}
          </div>
        </section>

        <Card className="mt-14">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-950">
              <Scale className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <h2 className="text-2xl font-semibold text-white">How to choose</h2>
          </div>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Start with the workflow you need to improve. Compare ease of use, collaboration
            features, integrations, customization, and the effort required to migrate your
            existing data.
          </p>
        </Card>

        <FaqSection items={faqItems} />

        {relatedSoftware.length > 0 ? (
          <section className="mt-14">
            <SectionHeading eyebrow="Keep exploring" title="Compare other tools" />

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedSoftware.map((item) => (
                <SoftwareCard key={item.slug} software={item} />
              ))}
            </div>
          </section>
        ) : null}

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
