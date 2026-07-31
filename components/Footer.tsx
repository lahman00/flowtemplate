import Link from "next/link";
import { Layers } from "lucide-react";
import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <Container className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-950">
            <Layers className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Flowtemplate
        </Link>

        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Flowtemplate — independent comparisons, not affiliated
          with the listed brands.
        </p>
      </Container>
    </footer>
  );
}
