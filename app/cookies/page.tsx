import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const TITLE = "Cookie Policy";
const PATH = "/cookies";

export const metadata: Metadata = {
  title: TITLE,
  description: "Flowtemplate's actual cookie usage: none for analytics, advertising, or authentication.",
  alternates: { canonical: PATH },
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title={TITLE}
      path={PATH}
      sections={[
        {
          heading: "Current status",
          body: (
            <p>
              As of the date at the top of this page, {SITE_NAME}{" "}
              <strong className="text-white">does not use cookies for analytics,
              advertising, authentication, or any other non-essential purpose.</strong> There
              are no accounts to log into and no tracking or advertising scripts running on this
              site, so there is nothing here that needs a cookie.
            </p>
          ),
        },
        {
          heading: "Why there's no cookie banner",
          body: (
            <p>
              Cookie consent banners exist to get permission before setting non-essential
              cookies. Since {SITE_NAME} doesn&apos;t set any, there&apos;s nothing to ask
              permission for — showing a banner anyway would be misleading, not more
              transparent.
            </p>
          ),
        },
        {
          heading: "Third-party sites",
          body: (
            <p>
              {SITE_NAME} links out to official vendor websites for the products we compare.
              Once you leave {SITE_NAME}, that site&apos;s own cookie and privacy practices
              apply — not this one. See our{" "}
              <Link href="/privacy" className="text-white underline underline-offset-4">
                Privacy Policy
              </Link>{" "}
              for more on third-party links.
            </p>
          ),
        },
        {
          heading: "If this changes",
          body: (
            <p>
              If {SITE_NAME} ever adds cookies for analytics, advertising, or accounts in the
              future, this page — and an appropriate consent mechanism — will be updated first,
              before those cookies are set.
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
