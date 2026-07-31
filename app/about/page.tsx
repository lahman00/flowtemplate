import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalContent } from "@/components/LegalContent";
import { JsonLd } from "@/components/JsonLd";
import { getBreadcrumbJsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Why Flowtemplate exists and how we choose which alternatives to compare.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "About", url: `${SITE_URL}/about` },
        ])}
      />

      <Container size="narrow">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About" }]} />

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          About Flowtemplate
        </h1>

        <p className="mt-6 text-lg leading-8 text-zinc-400">
          Flowtemplate helps you figure out what to switch to before you actually switch —
          comparing the strongest alternatives to the software you already use, side by side.
        </p>

        <LegalContent
          sections={[
            {
              heading: "How we pick alternatives",
              body: (
                <p>
                  Every comparison on this site is built around a tool&apos;s most common,
                  real-world substitutes — the products people actually consider when they&apos;re
                  evaluating a switch. We focus on core use case fit: what each alternative is
                  best at, and who it&apos;s a good match for.
                </p>
              ),
            },
            {
              heading: "Independence",
              body: (
                <p>
                  Flowtemplate is not affiliated with, sponsored by, or endorsed by any of the
                  software vendors named on this site. Product names, logos, and brands mentioned
                  here are the property of their respective owners.
                </p>
              ),
            },
            {
              heading: "Start comparing",
              body: (
                <p>
                  Search for a tool you&apos;re using today from{" "}
                  <Link href="/" className="text-white underline underline-offset-4">
                    the homepage
                  </Link>
                  , or jump straight into a comparison for{" "}
                  <Link href="/software/notion" className="text-white underline underline-offset-4">
                    Notion
                  </Link>{" "}
                  or{" "}
                  <Link href="/software/slack" className="text-white underline underline-offset-4">
                    Slack
                  </Link>
                  .
                </p>
              ),
            },
          ]}
        />
      </Container>
    </main>
  );
}
