import type { FaqItem, Software } from "@/data/software";
import { getSoftwareFaqItems } from "@/lib/faq";

export function generateTitle(software: Software): string {
  return `Best ${software.name} Alternatives`;
}

export function generateH1(software: Software): string {
  return `Best ${software.name} alternatives`;
}

export function generateMetaDescription(software: Software): string {
  return `${software.description} Compare ${software.alternatives.length} real alternatives to find the best fit for your team.`;
}

export function generateIntro(software: Software): string {
  return software.description;
}

export function generateComparisonIntro(software: Software): string {
  return `See how the top ${software.name} alternatives compare on use case fit and core strengths.`;
}

export function generateFaq(software: Software): FaqItem[] {
  if (software.faq && software.faq.length > 0) {
    return software.faq;
  }
  return getSoftwareFaqItems(software);
}
