import Link from "next/link";
import { Layers } from "lucide-react";
import { Container } from "@/components/Container";

const footerLinks = [
  { name: "How it works", href: "/#how-it-works" },
  { name: "Browse", href: "/#browse" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy", href: "/privacy" },
  { name: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <Container className="py-12">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-950">
              <Layers className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Flowtemplate
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
            {footerLinks.map((link) => (
              <Link key={link.name} href={link.href} className="transition hover:text-white">
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500 sm:text-left">
          © {new Date().getFullYear()} Flowtemplate — independent comparisons, not affiliated
          with the listed brands.
        </p>
      </Container>
    </footer>
  );
}
