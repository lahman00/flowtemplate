import Link from "next/link";
import { Layers } from "lucide-react";
import { Container } from "@/components/Container";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur-lg">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-950">
            <Layers className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-base font-bold tracking-tight text-white">Flowtemplate</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-400 sm:flex">
          <Link href="/#how-it-works" className="transition hover:text-white">
            How it works
          </Link>
          <Link href="/#categories" className="transition hover:text-white">
            Categories
          </Link>
          <Link href="/#browse" className="transition hover:text-white">
            Browse
          </Link>
        </nav>

        <Link
          href="/#search"
          className="inline-flex min-h-9 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Compare now
        </Link>
      </Container>
    </header>
  );
}
