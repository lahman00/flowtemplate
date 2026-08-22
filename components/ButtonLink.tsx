import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentProps } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/lib/button-styles";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * WAR MODE mission (2026-08-22) Phase 23 — forwards its ref to the
 * underlying <a> (next/link's Link forwards to a real anchor element)
 * instead of being a plain function component that silently drops any
 * ref passed to it. Needed so components/TrackedCtaLink.tsx can attach
 * an IntersectionObserver directly to the real, laid-out anchor element —
 * observing a zero-box `display: contents` wrapper around it, the
 * previous approach, never reports an intersection at all.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant, size, className, ...props },
  ref
) {
  return <Link ref={ref} className={buttonClasses(variant, size, className)} {...props} />;
});
