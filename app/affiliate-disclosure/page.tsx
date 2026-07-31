import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const TITLE = "Affiliate Disclosure";
const PATH = "/affiliate-disclosure";

export const metadata: Metadata = {
  title: TITLE,
  description: "How affiliate relationships would work on Flowtemplate, and their current status.",
  alternates: { canonical: PATH },
};

export default function AffiliateDisclosurePage() {
  return (
    <LegalPageLayout
      title={TITLE}
      path={PATH}
      sections={[
        {
          heading: "Current status",
          body: (
            <p>
              As of the date at the top of this page, <strong className="text-white">no
              link on {SITE_NAME} is an affiliate link.</strong> Every &quot;Visit official
              site&quot; button on a software page points directly to that vendor&apos;s own
              website, with no tracking parameter and no commission attached.
            </p>
          ),
        },
        {
          heading: "How this may change",
          body: (
            <p>
              {SITE_NAME} may join affiliate programs in the future. If that happens, some
              outbound links on this site may become affiliate links — meaning {SITE_NAME}
              could earn a commission if you sign up for or purchase a product through that
              link, <strong className="text-white">at no extra cost to you</strong>. The price
              you pay a vendor is never higher because you came from an affiliate link.
            </p>
          ),
        },
        {
          heading: "Labeling commitment",
          body: (
            <p>
              We do not label a link as an affiliate link unless it actually is one, and we do
              not disguise affiliate links as ordinary links. Any link that is genuinely an
              affiliate link is marked with a <code className="text-zinc-300">rel=&quot;sponsored&quot;</code> attribute,
              consistent with how search engines expect paid or affiliate links to be
              identified.
            </p>
          ),
        },
        {
          heading: "Editorial independence",
          body: (
            <p>
              Whether or not a commercial relationship exists with a vendor never controls
              which alternatives are listed, how a product is described, or how comparisons are
              structured. Every entry goes through the same sourced, validated data pipeline
              described in our{" "}
              <Link href="/editorial-policy" className="text-white underline underline-offset-4">
                Editorial Policy
              </Link>{" "}
              and{" "}
              <Link href="/sources-policy" className="text-white underline underline-offset-4">
                Sources Policy
              </Link>
              , regardless of any affiliate status.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about this disclosure? Reach us at{" "}
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
