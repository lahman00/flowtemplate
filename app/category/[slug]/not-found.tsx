import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ButtonLink";

export const metadata: Metadata = {
  title: "Category Not Found",
};

export default function CategoryNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center py-24">
      <Container className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <LayoutGrid className="h-6 w-6" strokeWidth={2} />
        </span>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          We don&apos;t have that category yet
        </h1>

        <p className="mt-4 max-w-md text-zinc-400">
          Browse the categories we do cover from the homepage.
        </p>

        <ButtonLink href="/" className="mt-8">
          Back to home
        </ButtonLink>
      </Container>
    </main>
  );
}
