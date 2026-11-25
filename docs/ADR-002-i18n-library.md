# ADR-002 — Internationalization library

- **Status:** Approved by owner on 2026-11-25
- **Date:** 2026-11-25
- **Scope:** UI translations, locale routing, metadata, RTL/LTR document direction
- **Related:** `docs/PROJECT_SPEC.md`, `docs/PRODUCTION_CHECKLIST.md`, `src/i18n/`, `messages/`

## Context

The first implementation used hand-written TypeScript dictionaries. That worked for a small scaffold but duplicated locale plumbing across server components, client components and metadata. The owner explicitly chose a real i18n library and asked for all UI copy to move to it.

## Decision

Use **next-intl 4.16.2** for all UI copy and locale-aware routing.

- `src/i18n/routing.ts` defines `en`/`ar`, `defaultLocale: "ar"`, `localePrefix: "always"`, and disables `Accept-Language`/cookie detection so explicit routes remain authoritative.
- `src/i18n/request.ts` loads `messages/<locale>.json` with `next/root-params` support for Next.js 16.3+.
- `src/proxy.ts` delegates locale negotiation and `/` → `/ar` to `next-intl/middleware`, then applies the signed-out admin UX pre-filter. Server-side session checks remain the security boundary.
- `src/app/[locale]/layout.tsx` supplies `NextIntlClientProvider` so Client Components can use `useTranslations`.
- Server components and metadata use `getTranslations` through small compatibility wrappers in `src/lib/i18n.ts` and `src/lib/admin-i18n.ts`.
- CMS-owned content (profile, skills, projects, certifications, contact methods) stays in SQLite. Only interface strings live in `messages/*.json`.

## Consequences

- Adding or changing UI copy now means editing both `messages/en.json` and `messages/ar.json`; missing translations are a review blocker, never machine-generated.
- English-only curated project content remains an explicit owner decision and is not translated by next-intl.
- `next.config.ts` is wrapped with `createNextIntlPlugin()` while retaining the existing `cacheComponents`, `partialPrefetching`, and Tailwind Turbopack rules.
- `npm run verify` remains the single verification gate; it passes with the migrated catalogs.
