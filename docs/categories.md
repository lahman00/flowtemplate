# Category system

## Data

`data/categories/categories.json` lists the 8 canonical categories:
Project Management, Communication, CRM, Productivity, Knowledge Base,
Automation, Design, Scheduling. Each has a `slug`, `name`, and one-sentence
`description`. Validated by `data/categories/schema.ts` and loaded by
`data/categories/index.ts` (`getAllCategories`, `getCategory(slug)`,
`getCategoryName(slug)`).

Every software entry's `category` field must be one of these slugs — the
software loader (`data/software/index.ts`) throws at build time if it isn't.

## Why a file collision bug happened here (and how it was fixed)

The first attempt created both `data/categories.json` (the raw data) and
`data/categories/` (the loader module) side by side. TypeScript's
`resolveJsonModule` let `@/data/categories` resolve to the `.json` file
instead of the loader's `index.ts`, so `getAllCategories` appeared to not
exist — the exact same class of bug as Sprint 3's `data/software.ts` vs
`data/software/` collision. Fixed the same way: the raw data file moved
inside the module directory (`data/categories/categories.json`), so there's
only one thing `@/data/categories` can resolve to.

## Route: `/category/[slug]`

`app/category/[slug]/page.tsx` — `generateStaticParams` from
`getAllCategories()`, `generateMetadata` per category, breadcrumbs
(Home / Category), a `CollectionPage` JSON-LD block (`getCategoryJsonLd`)
listing every software in that category, and a grid of `SoftwareCard`s from
`getSoftwareByCategory(slug)`. `app/category/[slug]/not-found.tsx` handles
an unknown category slug.

## Internal linking

- Every software page's category badge links to its `/category/[slug]`.
- The homepage has a dedicated "Browse by category" section linking to all
  8 category pages (also in the nav bar), so no category page is orphaned —
  `npm run validate:data` also checks this explicitly (a category with zero
  software would be a real dead end).
- The sitemap includes all 8 category URLs.
