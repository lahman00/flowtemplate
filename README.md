# Flowtemplate

A software-comparison directory built with Next.js App Router. For any
tool, see verified alternatives grouped by category — sourced facts only,
nothing fabricated.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev            # start the dev server
npm run build           # production build (also runs TypeScript checks)
npm run lint             # ESLint
npm run validate:data    # validate every data/software/*.json and data/categories entry
```

Run `validate:data` after editing any data file — it checks the same rules
the build enforces (schema, duplicate slugs, broken references, invalid
categories, orphan category pages) without doing a full production build.

## Project structure

```
app/                    Routes (App Router)
  software/[slug]/       One page per software entry
  category/[slug]/        One page per category
  about|contact|privacy|terms/
data/
  software/*.json         One file per software entry (source of truth)
  categories/              Category definitions + loader
lib/
  generators.ts             Page copy generators (title, H1, FAQ, etc.)
  related.ts                 Related/same-category/popular utilities
  comparison.ts                /compare engine (built, not routed)
  monetization.ts               Monetization-ready utilities (no live data)
  structured-data.ts             JSON-LD builders
components/               Reusable UI components
scripts/validate-data.ts   Standalone data validator (npm run validate:data)
docs/                      Architecture documentation
```

## Data and sourcing policy

Every software entry lives in its own JSON file and is validated with Zod
at build time. Nothing in this dataset is invented: every entry cites at
least one official source, and fields with no verified source (pricing,
founding date, parent company, pros/cons) are left unpopulated rather than
guessed. See [`docs/content-engine.md`](docs/content-engine.md) for the
full policy and schema.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
