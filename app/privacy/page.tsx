import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const TITLE = "Privacy Policy";
const PATH = "/privacy";

export const metadata: Metadata = {
  title: TITLE,
  description: "How Flowtemplate handles data, cookies, and third-party links.",
  alternates: { canonical: PATH },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title={TITLE}
      path={PATH}
      sections={[
        {
          heading: "Overview",
          body: (
            <p>
              {SITE_NAME} is an informational comparison site. This page explains what happens —
              and, just as importantly, what doesn&apos;t happen — to your data when you use it.
            </p>
          ),
        },
        {
          heading: "Information we collect",
          body: (
            <>
              <p>
                {SITE_NAME} has no user accounts and no database. Searching for software or
                browsing comparisons doesn&apos;t submit any data to a server — it all happens
                directly in your browser.
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
              This site does not set its own cookies. See our{" "}
              <Link href="/cookies" className="text-white underline underline-offset-4">
                Cookie Policy
              </Link>{" "}
              for the full detail on this.
            </p>
          ),
        },
        {
          heading: "Third-party links",
          body: (
            <p>
              {SITE_NAME} describes and compares third-party software products. We link to
              information about those products, but we don&apos;t control their sites or their
              privacy practices — review each vendor&apos;s own policy before using their
              product.
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
          heading: "Related policies",
          body: (
            <p>
              See also our{" "}
              <Link href="/terms" className="text-white underline underline-offset-4">
                Terms of Service
              </Link>
              ,{" "}
              <Link href="/disclaimer" className="text-white underline underline-offset-4">
                Disclaimer
              </Link>
              , and{" "}
              <Link href="/cookies" className="text-white underline underline-offset-4">
                Cookie Policy
              </Link>
              .
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
  );
}
