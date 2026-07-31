import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalContent } from "@/components/LegalContent";
import { JsonLd } from "@/components/JsonLd";
import { getBreadcrumbJsonLd } from "@/lib/structured-data";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply to using Flowtemplate.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Terms of Service", url: `${SITE_URL}/terms` },
        ])}
      />

      <Container size="narrow">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Terms of Service" }]} />

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated July 31, 2026</p>

        <LegalContent
          sections={[
            {
              heading: "Acceptance of terms",
              body: (
                <p>
                  By using {SITE_NAME}, you agree to these terms. If you don&apos;t agree, please
                  don&apos;t use the site.
                </p>
              ),
            },
            {
              heading: "Use of the site",
              body: (
                <p>
                  {SITE_NAME} provides general, informational comparisons between software
                  products to help you research alternatives. It is not professional advice, and
                  it isn&apos;t a substitute for verifying pricing, features, and terms directly
                  with each vendor before you decide to switch.
                </p>
              ),
            },
            {
              heading: "Trademarks",
              body: (
                <p>
                  All product names, logos, and brands referenced on this site — including but
                  not limited to the tools and alternatives listed in our comparisons — are the
                  trademarks of their respective owners. {SITE_NAME} is an independent site and
                  is not affiliated with, sponsored by, or endorsed by any of them.
                </p>
              ),
            },
            {
              heading: "No warranty",
              body: (
                <p>
                  Content on this site is provided &quot;as is,&quot; without warranty of any
                  kind. We do our best to keep comparisons accurate, but software products change
                  constantly — always confirm current details with the vendor before making a
                  decision.
                </p>
              ),
            },
            {
              heading: "Limitation of liability",
              body: (
                <p>
                  {SITE_NAME} is not liable for any decisions made, or losses incurred, based on
                  information found on this site.
                </p>
              ),
            },
            {
              heading: "Changes to these terms",
              body: (
                <p>
                  We may update these terms from time to time. Continued use of the site after a
                  change means you accept the updated terms.
                </p>
              ),
            },
            {
              heading: "Contact",
              body: (
                <p>
                  Questions about these terms? Reach us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-4">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  or via the{" "}
                  <Link href="/contact" className="text-white underline underline-offset-4">
                    contact page
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
