import { Activity, DollarSign, ExternalLink, FileText, LifeBuoy, Plug, Users } from "lucide-react";
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
 * covers the other six link types, and only when at least one is actually
 * present. Renders nothing today — no entry populates software.links yet.
 * Do not invent a URL here; leave the field unset instead.
 */
export function VendorLinksBlock({ software }: { software: Software }) {
  const candidates: Array<{ label: string; url?: string; icon: ComponentType<LucideProps> }> = [
    { label: "Pricing", url: software.links?.pricing, icon: DollarSign },
    { label: "Documentation", url: software.links?.docs, icon: FileText },
    { label: "Support", url: software.links?.support, icon: LifeBuoy },
    { label: "Integrations", url: software.links?.integrations, icon: Plug },
    { label: "Status page", url: software.links?.status, icon: Activity },
    { label: "Community", url: software.links?.community, icon: Users },
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
