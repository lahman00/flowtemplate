import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const TITLE = "Sources Policy";
const PATH = "/sources-policy";

export const metadata: Metadata = {
  title: TITLE,
  description: "Where Flowtemplate's product facts come from, and what we intentionally leave out.",
  alternates: { canonical: PATH },
};

export default function SourcesPolicyPage() {
  return (
    <LegalPageLayout
      title={TITLE}
      path={PATH}
      sections={[
        {
          heading: "Official product pages are our primary source",
          body: (
            <p>
              For what a product is, what it does, and who it&apos;s built for, our primary
              source is that vendor&apos;s own official website. Every software page on{" "}
              {SITE_NAME} lists the exact source URLs its facts were drawn from.
            </p>
          ),
        },
        {
          heading: "We deliberately don't track pricing",
          body: (
            <p>
              We do not publish specific prices, plan tiers, or discount details. Pricing
              changes far more often than a periodically reviewed page can stay accurate for, so
              rather than risk showing a stale number as current fact, we omit pricing entirely
              and point you to the vendor&apos;s own pricing page instead.
            </p>
          ),
        },
        {
          heading: "Third-party sources, only when clearly identified",
          body: (
            <p>
              The large majority of facts on this site come from a direct fetch of the
              vendor&apos;s own official page. In the small number of cases where an official
              site could not be fetched directly (for example, if it blocks automated requests),
              we note that plainly rather than presenting it as an ordinary direct source.
            </p>
          ),
        },
        {
          heading: "Access dates are stored",
          body: (
            <p>
              Every entry records the date its sources were fetched and verified. This date
              doesn&apos;t appear as a separate calendar on every page, but it&apos;s part of
              the entry&apos;s underlying record and is one of the signals we use when deciding
              an entry needs re-checking.
            </p>
          ),
        },
        {
          heading: "Unverifiable fields are left blank",
          body: (
            <p>
              Details like a company&apos;s founding year, its parent company, or specific
              named strengths and weaknesses are left empty on any entry where no official
              source clearly states them — never filled in with a plausible-sounding guess.
            </p>
          ),
        },
        {
          heading: "See also",
          body: (
            <p>
              Our{" "}
              <Link href="/editorial-policy" className="text-white underline underline-offset-4">
                Editorial Policy
              </Link>{" "}
              covers how sourced facts turn into published pages, and our{" "}
              <Link href="/ai-usage" className="text-white underline underline-offset-4">
                AI Usage Disclosure
              </Link>{" "}
              covers what role automation plays in that process.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about a specific source? Reach us at{" "}
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
  );
}
