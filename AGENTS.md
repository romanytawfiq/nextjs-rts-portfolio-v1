# AGENTS.md — portfolio + private admin CMS

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Phase gate

- **Frontend and backend implementation authorized by owner (2026-11-25):** public UI, admin UI, local-dev SQLite CMS, GitHub OAuth allowlist, local username/password admin login, and server-side GitHub sync are in progress. **Production storage/host is still undecided:** use a local SQLite file for development only, no ORM, and never place the durable DB on an ephemeral serverless filesystem. Auth fails closed until `SESSION_SECRET` and at least one admin login method are configured; GitHub sign-in also needs OAuth credentials and `GITHUB_ADMIN_ID` in `.env.local`. Keep seeded content to CV-verified facts only.
- Full baseline spec: `docs/PROJECT_SPEC.md`; CV source of truth: `docs/Romany_tawfiq cv.pdf`. Mark unknown owner facts "Pending owner input"; never invent contact details, URLs, credentials, education, or work history. Separate confirmed facts / recommendations / assumptions / unresolved decisions.

## Commands and repo layout

- Single npm package (`package-lock.json`), no workspaces. Scripts: `npm run dev`, `build`, `start`, `lint`. No test, typecheck, format, or codegen script exists; use `npx --no-install tsc --noEmit` for types. Both `lint` and `tsc --noEmit` pass on the current scaffold.
- App Router under `src/app` (currently only create-next-app scaffold files); path alias `@/*` → `./src/*`. `README.md` is generic boilerplate, not project guidance.
- Pinned toolchain: Next 16.4.6, React 19.3.0, Tailwind 4.3.3 through `@tailwindcss/turbopack`. `next.config.ts` deliberately enables `cacheComponents`, `partialPrefetching`, and a custom `*.css` Turbopack loader rule — don't strip them as scaffold noise.
- Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/01-app/` for this installed version. `next dev` rewrites the managed rule block above to match the installed version; keep it committed rather than deleting it.

## Constraints that change decisions

- Owner-approved stack: Next.js, OAuth, SQLite, Tailwind, Axios, Framer Motion, Zustand, React Hook Form, Zod. Add/replace only via owner-approved decision (ADR). Prefer Server Components; Zustand only for shared client UI state; client validation is never a security boundary.
- Public and admin are bilingual: AR `rtl` / EN `ltr` at document-layout level, explicit `/en` and `/ar` routes, plus light/dark themes. Default locale is unapproved. Flag missing translations; do not machine-translate or invent Arabic copy.
- GitHub OAuth admin login: allowlist a stable numeric GitHub ID, minimal scopes, no `repo` scope just to list public repos, server-side authz on every admin page and mutation. Public repo sync is server-side, cached, paginated and rate-limit aware; curated projects are separate from synced repository metadata.
- Production SQLite storage/host is undecided (Vercel is only an assumption). Don't put the durable DB on an ephemeral serverless filesystem or pick an ORM before that decision.
- `.env*` is gitignored; secrets and tokens never in `NEXT_PUBLIC_*`. Publish personal contact details, certificate links, and project links only when owner-approved.
