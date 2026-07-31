import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalContent } from "@/components/LegalContent";
import { JsonLd } from "@/components/JsonLd";
import { getBreadcrumbJsonLd } from "@/lib/structured-data";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Flowtemplate handles data, cookies, and third-party links.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 py-16 sm:py-20">
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Privacy Policy", url: `${SITE_URL}/privacy` },
        ])}
      />

      <Container size="narrow">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Privacy Policy" }]} />

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-zinc-500">Last updated July 31, 2026</p>

        <LegalContent
          sections={[
            {
              heading: "Overview",
              body: (
                <p>
                  Flowtemplate is an informational comparison site. This page explains what
                  happens — and, just as importantly, what doesn&apos;t happen — to your data
                  when you use it.
                </p>
              ),
            },
            {
              heading: "Information we collect",
              body: (
                <>
                  <p>
                    Flowtemplate has no user accounts and no database. Searching for software or
                    browsing comparisons doesn&apos;t submit any data to a server — it all
                    happens directly in your browser.
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>We do not require or collect account information.</li>
                    <li>We do not store search queries.</li>
                    <li>Our Contact page opens your own email client — we never receive form data server-side.</li>
                  </ul>
                </>
              ),
            },
            {
              heading: "Cookies",
              body: (
                <p>
                  This site does not set its own cookies or use tracking or analytics scripts.
                  Your hosting provider or browser may still handle standard, low-level
                  technical data (like request logs) as part of normal web infrastructure.
                </p>
              ),
            },
            {
              heading: "Third-party links",
              body: (
                <p>
                  Flowtemplate describes and compares third-party software products. We link to
                  information about those products, but we don&apos;t control their sites or
                  their privacy practices — review each vendor&apos;s own policy before using
                  their product.
                </p>
              ),
            },
            {
              heading: "Changes to this policy",
              body: (
                <p>
                  If this policy changes, we&apos;ll update the date at the top of this page.
                  Continued use of the site after a change means you accept the updated policy.
                </p>
              ),
            },
            {
              heading: "Contact",
              body: (
                <p>
                  Questions about this policy? Reach us at{" "}
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
