import Link from "next/link";
import { Layers } from "lucide-react";
import { Container } from "@/components/Container";
import { LEGAL_PAGES } from "@/lib/legal";
import { SITE_NAME } from "@/lib/site";

const productLinks = [
  { name: "How it works", href: "/#how-it-works" },
  { name: "Categories", href: "/#categories" },
  { name: "Browse", href: "/#browse" },
];

const companyLinks = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ name: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.name}>
            <Link href={link.href} className="text-sm text-zinc-400 transition hover:text-white">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-950">
                <Layers className="h-4 w-4" strokeWidth={2.5} />
              </span>
              {SITE_NAME}
            </Link>
            <p className="mt-4 max-w-[22ch] text-sm leading-6 text-zinc-500">
              Software alternatives, compared honestly.
            </p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Legal & trust" links={LEGAL_PAGES} />
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} {SITE_NAME} — independent comparisons, not affiliated
            with the listed brands.
          </p>
        </div>
      </Container>
    </footer>
  );
}
