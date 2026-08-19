import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { SITE_EMAIL, SITE_NAME } from "@/lib/site";

const TITLE = "Privacy Policy";
const PATH = "/privacy";

export const metadata: Metadata = {
  title: TITLE,
  description: `How ${SITE_NAME} handles data, cookies, and third-party links.`,
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
              {SITE_NAME}{" "}
              is an informational comparison site. This page explains what happens —
              and, just as importantly, what doesn&apos;t happen — to your data when you use it.
            </p>
          ),
        },
        {
          heading: "Information we collect",
          body: (
            <>
              <p>
                {SITE_NAME}{" "}
                has no user accounts and does not require visitors to create an
                account. Searching for software or browsing comparisons doesn&apos;t submit any
                personal data to a server — it all happens directly in your browser.
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
              This site sets no cookies for advertising, authentication, or any other
              non-essential purpose — ever. It does use Google Analytics, but the analytics
              cookie is not set until you explicitly choose &quot;Allow analytics&quot; in the
              banner shown on your first visit. See our{" "}
              <Link href="/cookies" className="text-white underline underline-offset-4">
                Cookie Policy
              </Link>{" "}
              for the full detail on this, including how to change your choice.
            </p>
          ),
        },
        {
          heading: "Third-party links",
          body: (
            <p>
              {SITE_NAME}{" "}
              describes and compares third-party software products. We link to
              information about those products, but we don&apos;t control their sites or their
              privacy practices — review each vendor&apos;s own policy before using their
              product.
            </p>
          ),
        },
        {
          heading: "Outbound link tracking",
          body: (
            <p>
              When you click a &quot;Visit official site&quot; or affiliate link on a product
              or comparison page, {SITE_NAME}{" "}
              may record that the click happened — which product, which page it was on, which
              button, and the destination link — for internal analytics and revenue
              measurement. Recording an outbound click doesn&apos;t use a cookie or create any
              account or identifier for you, and it doesn&apos;t capture your IP address or
              browser information. This information stays on {SITE_NAME}&apos;s own systems; it
              isn&apos;t sold or shared with a third-party analytics provider.
            </p>
          ),
        },
        {
          heading: "Third-party platform integrations",
          body: (
            <p>
              {SITE_NAME}{" "}
              may connect to third-party platforms, such as LinkedIn, to manage and
              publish {SITE_NAME}&apos;s own content. When such an integration is enabled, {SITE_NAME}{" "}
              may receive and process limited information necessary to authenticate and operate
              it — for example, authorization credentials or tokens, account or organization
              identifiers, and information related to content managed or published through the
              integration. This information is used only to operate the relevant integration. It
              is not sold, and it is not used by {SITE_NAME}{" "}
              for advertising. Information received
              from a third-party platform is handled in accordance with that platform&apos;s own
              terms and policies.
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
              <a href={`mailto:${SITE_EMAIL}`} className="text-white underline underline-offset-4">
                {SITE_EMAIL}
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
