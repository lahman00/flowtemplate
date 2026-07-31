import { getSoftware, type Software } from "@/data/software";
import { getCategory, type Category } from "@/data/categories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function getBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getSoftwareApplicationJsonLd(software: Software) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${software.name} alternatives`,
    itemListElement: software.alternatives.map((alternative, index) => {
      const alternativeSoftware = getSoftware(alternative.slug);
      const categoryName = alternativeSoftware
        ? getCategory(alternativeSoftware.category)?.name
        : getCategory(software.category)?.name;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SoftwareApplication",
          name: alternative.name,
          description: alternative.description,
          applicationCategory: categoryName,
          url: `${SITE_URL}/software/${alternative.slug}`,
        },
      };
    }),
  };
}

export function getFaqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getCategoryJsonLd(category: Category, software: Software[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/category/${category.slug}`,
    hasPart: software.map((item) => ({
      "@type": "SoftwareApplication",
      name: item.name,
      description: item.description,
      url: `${SITE_URL}/software/${item.slug}`,
    })),
  };
}
