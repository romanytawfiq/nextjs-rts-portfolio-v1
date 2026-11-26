# Romany Tawfiq Shehata — portfolio + private CMS

Bilingual (Arabic-first) portfolio with a private admin dashboard and a local SQLite CMS. Public content is CV-derived and editable only through authenticated server-side routes.

**Status:** implementation and local verification are complete. Production is **not** released: domain, Hostinger plan/path verification, credential rotation and a real GitHub sign-in are still open. See `docs/PRODUCTION_CHECKLIST.md`.

## Requirements

- Node.js **24 or newer** (`node:sqlite` is used; see `engines` in `package.json`)
- npm
- A persistent writable directory for the SQLite database in production

## Quick start

```bash
npm ci
cp .env.example .env.local
# Fill in .env.local (see below), then:
npm run dev
```

- Public site: `http://localhost:3000/ar` (default) and `http://localhost:3000/en`
- `/` redirects to `/ar`
- Admin: `/ar/admin/login` or `/en/admin/login`
- Health check: `/api/health`

Authentication uses **Auth.js (NextAuth v5 beta)** for GitHub OAuth and local username/password sessions. It **fails closed**: admin pages and mutations are unavailable until `AUTH_SECRET` (or the legacy `SESSION_SECRET` alias) is at least 32 characters and at least one login method is configured. The login page stays reachable to explain the configuration state.

### Minimum local admin setup

```bash
npm run admin:password
```

Enter the password interactively. The script stores a `scrypt` hash in the SQLite database; never pass the password as an argument or commit it. There is **one** local admin credential: rerunning the script replaces both the username and password. Changing it invalidates existing password sessions.

GitHub sign-in additionally needs `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `GITHUB_ADMIN_ID` (stable numeric ID), and a registered callback `<SITE_URL>/api/auth/callback/github`. Only `read:user` is requested — no `repo` scope. The legacy `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` names still work as aliases. If the username looks wrong, use the username printed by `npm run admin:password` and make sure the same `SQLITE_PATH` is exported for both setup and the server.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate Next.js route types with `next typegen`, then run non-incremental `tsc --noEmit` |
| `npm test` | Smoke tests against an isolated temp DB |
| `npm run verify` | Lint + typecheck (including generated route types) + build + tests |
| `npm run admin:password` | Set or rotate the local admin password |
| `npm run db:backup` | `VACUUM INTO` backup of `SQLITE_PATH` |

Do not run bare `tsc --noEmit` on a fresh clone: Next.js 16 generates `PageProps`, `LayoutProps` and route types into `.next/types/`. Use `npm run typecheck` (or `npm run verify`) so `next typegen` runs first; otherwise TypeScript reports `TS2304` for those generated globals.

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env*` and never use `NEXT_PUBLIC_*` for secrets.

| Variable | Notes |
| --- | --- |
| `AUTH_SECRET` | ≥32 characters; Auth.js session secret. `SESSION_SECRET` is accepted as a migration alias. |
| `AUTH_TRUST_HOST` | Set to `1` on the VPS/Hostinger host; Auth.js uses the forwarded public host. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Server-side OAuth credentials; legacy `GITHUB_CLIENT_*` names are aliases. |
| `GITHUB_ADMIN_ID` | Allowlisted numeric GitHub ID; sign-in is locked when empty |
| `GITHUB_REPO_OWNER` | Public account whose repositories may be synced (`romanytawfiq`) |
| `GITHUB_TOKEN` | Optional read-only token, no `repo` scope |
| `SITE_URL` | Absolute origin for callbacks and canonical URLs |
| `SQLITE_PATH` | SQLite file path; defaults to `.data/portfolio.sqlite` |
| `TRUST_PROXY` | Set to `1` only behind a trusted reverse proxy |

## Project layout

```text
src/app/[locale]/(public)/      Public EN/AR pages
src/app/[locale]/admin/         Private dashboard pages + Suspense fallback
src/app/api/auth/[...nextauth]/ Auth.js GET/POST handlers
src/app/api/auth/error-page/    Localized Auth.js error redirect
src/app/api/                    CMS and health route handlers
src/auth.ts                     Auth.js providers, callbacks and JWT session
src/proxy.ts                    Next 16 Proxy: locale routing + signed-out prefilter
src/components/                 Shared UI, reveal animation, scroll progress
src/lib/auth-error.ts           Auth.js error-code normalization
src/lib/auth-validation.ts      Shared login form/credentials validation
src/lib/content.ts              CV-derived seed content (source of truth for seeds)
src/lib/server/auth.ts          Server-side session checks and data access layer
src/lib/server/auth-env.ts      Auth secret, OAuth and allowlist configuration
src/lib/server/auth-types.ts    Shared session types
src/lib/server/audit.ts         Login audit records
src/lib/server/db.ts            SQLite schema, migrations and idempotent seeding
src/lib/server/request-origin.ts Origin checks for auth and mutations
src/lib/server/content.ts       Public/admin read models and CMS writes
src/lib/schemas/cms.ts          Zod validation for every CMS section
src/types/next-auth.d.ts        Session/JWT type augmentation
messages/{en,ar}.json           next-intl UI copy
public/certificates/            Published owner-supplied certificate PDFs (15)
docs/                           Spec, decisions, deployment and checklist
tests/smoke.test.mjs            End-to-end smoke test
```

## Content and localization

- Arabic is the default locale; explicit `/en` and `/ar` routes set `dir="ltr"` / `dir="rtl"` at the document level.
- All UI copy goes through `next-intl` message catalogs. CMS content lives in SQLite.
- Seed values come from `docs/Romany_tawfiq cv.pdf` and owner-provided files. Do not invent facts, URLs or Arabic prose.
- Assets published by the owner: `public/rts.jpeg` (hero photo), `public/rts_cv.pdf` (downloadable CV), and 15 certificate PDFs under `public/certificates/`. Certificate titles, issuers and dates were transcribed from the owner-supplied PDFs (the source folder is not retained in the repo); cards link to both the issuer verification page (where printed on the certificate) and the PDF.
- Project titles/descriptions remain English-only by owner decision. Missing or unverified fields are omitted from the UI; no invented values or owner-review notices are shown.
- A dedicated admin localization coverage page was removed at the owner's request (2026-11-26). Bilingual routing remains, and missing copy is tracked in planning docs rather than shown as UI alerts.

## Admin CMS

Dashboard sections: overview, profile, skills, projects, certifications, contact, social links, GitHub sync, preview and settings. Array sections support add/remove/reorder/publish actions plus a validated JSON editor. All page and mutation access is checked server-side (`requireAdminPage` / `authorizeApi`); client validation is not a security boundary.

With `cacheComponents: true`, admin pages export `instant = false`, the session DAL calls `connection()` before reading Auth.js, and `src/app/[locale]/admin/loading.tsx` provides the Suspense fallback. Keep these together: removing them brings back the prerender errors in the dev console.

GitHub sync is server-side, cached, paginated and rate-limit aware. Curated projects are separate from synced repository metadata.

## Deployment

Production target is **Hostinger regular/shared hosting with Node.js Web Apps** (ADR-001). Hostinger replaces `hbuilds/` on each deploy, so `SQLITE_PATH` must point to a persistent path outside it, for example `/home/<user>/portfolio-data/portfolio.sqlite`. Set environment variables in hPanel, never in the repo.

Follow `docs/HOSTINGER_DEPLOYMENT.md` for hPanel settings, initial credential setup, backups, restore drill, monitoring and go-live checks. Run `npm run verify` (also run in `.github/workflows/ci.yml`) before deploying.

## Documentation

- `docs/PROJECT_SPEC.md` — baseline specification and confirmed facts
- `docs/ADR-001-deployment.md` — hosting/SQLite decision record
- `docs/ADR-002-i18n-library.md` — next-intl decision record
- `docs/ADR-004-auth-library.md` — Auth.js session/OAuth decision record
- `docs/HOSTINGER_DEPLOYMENT.md` — deployment runbook
- `docs/PRODUCTION_CHECKLIST.md` — owner blockers and implementation state
