"use client";

import {
  Activity,
  Building2,
  DollarSign,
  ExternalLink,
  FileText,
  LifeBuoy,
  Plug,
  Rocket,
  Tag,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import type { Software } from "@/data/software";

type VendorLinkDef = {
  label: string;
  url: string;
  icon: ComponentType<LucideProps>;
};

/**
 * Sprint 6 Phase 5 — reusable vendor link block. The official website
 * already has its own dedicated CTA elsewhere on the page, so this only
 * covers the other link types (pricing, trial, docs, support,
 * integrations, status, community, deals, enterprise — the last three
 * added Sprint 20 Phase 7 as affiliate-readiness insertion points), and
 * only when at least one is actually present. Renders nothing today — no
 * entry populates software.links yet. Do not invent a URL here; leave the
 * field unset instead.
 *
 * A client component since Sprint 9 (Task 6): each link fires a
 * best-effort outbound-click event on click — see components/TrackedCtaLink.tsx
 * for the same pattern applied to the main CTA button.
 */
export function VendorLinksBlock({ software }: { software: Software }) {
  const pathname = usePathname();
  const candidates: Array<{ label: string; url?: string; icon: ComponentType<LucideProps> }> = [
    { label: "Pricing", url: software.links?.pricing, icon: DollarSign },
    { label: "Free trial", url: software.links?.trial, icon: Rocket },
    { label: "Documentation", url: software.links?.docs, icon: FileText },
    { label: "Support", url: software.links?.support, icon: LifeBuoy },
    { label: "Integrations", url: software.links?.integrations, icon: Plug },
    { label: "Status page", url: software.links?.status, icon: Activity },
    { label: "Community", url: software.links?.community, icon: Users },
    { label: "Current deals", url: software.links?.deals, icon: Tag },
    { label: "Enterprise contact", url: software.links?.enterprise, icon: Building2 },
  ];

  const links: VendorLinkDef[] = candidates
    .filter((link) => Boolean(link.url))
    .map((link) => ({ ...link, url: link.url as string }));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
        More from {software.name}
      </h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
              onClick={() => {
                const visitorId = typeof localStorage !== "undefined" ? localStorage.getItem("miloosh_vid") ?? undefined : undefined;
                const sessionId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("miloosh_sid") ?? undefined : undefined;
                const ctaLocation = `vendor-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`;
                void fetch("/api/outbound-click", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    slug: software.slug,
                    kind: "vendor-link",
                    sourcePage: pathname,
                    ctaLocation,
                    visitorId,
                    sessionId,
                  }),
                  keepalive: true,
                }).catch(() => {
                  // Best-effort only — a tracking failure must never affect the user's click.
                });
              }}
            >
              <link.icon className="h-4 w-4 shrink-0 text-zinc-500" />
              {link.label}
              <ExternalLink className="h-3 w-3 shrink-0 text-zinc-600" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
