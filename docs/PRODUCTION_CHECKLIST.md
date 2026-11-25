# Production checklist

**Status:** not release-ready. Owner decisions and inputs below are blockers. Do not paste real secrets, credentials, or callback URLs into chat, issues, or docs.

## BLOCKERS — owner decision/input required

### 1. Hosting + SQLite topology / ADR-001

- **Owner decision (2026-11-25):** Hostinger regular/shared hosting is the intended production host. `docs/ADR-001-deployment.md` has been amended with this decision.
- **Verification still required before deployment:** the chosen Hostinger plan must include **Node.js Web Apps**. Hostinger's managed Node.js service supports Node 24 and Next.js standalone server mode, but each deployment replaces `hbuilds/`; therefore `SQLITE_PATH` must point to a persistent writable path **outside `hbuilds/`** (for example `/home/<user>/portfolio-data/portfolio.sqlite`), not the repo-local `.data/portfolio.sqlite`.
- **Repo facts:** development uses `node:sqlite` `DatabaseSync` with WAL/SHM files and no ORM. Hostinger environment variables persist across deployments, and Runtime Logs capture stdout/stderr, including the structured `onRequestError` line. Step-by-step hPanel settings are in `docs/HOSTINGER_DEPLOYMENT.md`.
- **Do not proceed until:** the plan, persistent DB path, write test, backup location, and restore drill are verified on the real Hostinger account.

### 2. Production domain + OAuth callback

- **Owner input needed:** approve the production origin and the GitHub OAuth callback URL registered on the OAuth app.
- **Repo facts:** `SITE_URL` is an absolute origin used for OAuth callbacks and canonical URLs. `.env.example` documents the callback shape as `<SITE_URL>/api/auth/github/callback` and shows a localhost example. The start and callback route handlers build that callback from `SITE_URL`.
- **Do not proceed until:** production `SITE_URL` and the matching GitHub OAuth callback are confirmed and configured on the host and in GitHub.

### 3. Rotate exposed GitHub client secret and local admin password

- **Owner action needed:** rotate `GITHUB_CLIENT_SECRET` at GitHub and set a new local admin password with `npm run admin:password`. Do not reuse any value previously exposed in chat, docs, or local files.
- **Repo facts:** GitHub OAuth reads `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` server-side. Local password login stores a `scrypt` hash in `admin_credentials`; changing it also changes `auth_version`, which invalidates existing password sessions.
- **Do not proceed until:** rotation is completed on the real production identity and credentials are supplied only through host environment variables.

### 4. Fresh `SESSION_SECRET`

- **Owner input needed:** generate a new production-only `SESSION_SECRET` and install it on the host.
- **Repo facts:** `src/lib/server/auth.ts` requires at least 32 characters or auth fails closed. Sessions are HMAC-signed; no production secret value is present in this checklist.
- **Do not proceed until:** the production secret is set in the host environment, never in `NEXT_PUBLIC_*` and never committed.

### 5. Default locale — RESOLVED

- **Owner decision (2026-11-25):** Arabic is the default locale.
- **Repo facts:** `src/lib/i18n.ts` now sets `defaultLocale = "ar"`, `/` redirects to `/ar`, the metadata `x-default` is `/ar`, and the smoke test asserts the redirect. Explicit `/en` and `/ar` routes remain mandatory.

### 6. Missing CV-approved content/assets

- **Owner input needed:** provide or approve only verified content. The CV is the source of truth; do not invent URLs, prose, images, credentials, or history.
- **Resolved on 2026-11-25:** the owner approved an Arabic translation of the CV-derived About summary; it is seeded in `src/lib/content.ts` and stored in the local DB. Project descriptions are intentionally **English-only** by owner decision because the projects and GitHub descriptions are already in English; the Arabic "translation pending" badge and admin localization warning were removed for projects.
- **Resolved on 2026-11-26:** the owner supplied `public/rts.jpeg` and `public/rts_cv.pdf` and asked to publish them. `profile.image_url` and `profile.resume_url` now point to `/rts.jpeg` and `/rts_cv.pdf`; the public hero renders the photo and a CV link in both locales.
- **Resolved on 2026-11-26:** the owner supplied `certificaties/` with 15 certificate PDFs. All are seeded in SQLite with dates/issuers/verification links transcribed from the PDFs and published under `public/certificates/`; the public certification cards link to both the issuer verification page and the PDF. No Arabic certificate copy was invented.
- **Resolved on 2026-11-26:** the owner explicitly approved publishing `romanytawfiqshehata@gmail.com`. It is rendered in the contact section and footer in both locales.
- **Pending items recorded in `docs/PROJECT_SPEC.md`:**
  - Repository/live-demo URLs for SendFlow and the E-Commerce RESTful API if they cannot be verified through the authorized GitHub integration.
  - Arabic certification copy review; no invented Arabic certification text.
  - Education/work history only if the owner supplies verified details.
  - Asset storage decision for project/certification images.
- **Repo facts:** seeded content is CV-derived, and the UI renders explicit pending states instead of guessed values. `docs/Romany_tawfiq cv.pdf` is the source of truth.
- **Do not proceed until:** owner-approved content/assets are present or explicitly marked out of scope.

### 7. Real GitHub interactive sign-in

- **Owner action needed:** perform a real browser sign-in with the owner's GitHub account on the chosen production host using the approved stable numeric `GITHUB_ADMIN_ID`.
- **Repo facts:** `/api/auth/github/start` and `/callback` implement state protection, `read:user` scope, server-side token exchange, and numeric-ID allowlisting. The local DB has an `admin_allowlist` row and GitHub sync history, but that is not proof of production interactive sign-in.
- **Do not proceed until:** the owner signs in successfully, logout works, and a non-allowlisted account is confirmed to be rejected.

## IMPLEMENTATION CHECKS — passing locally

`npm run verify` runs lint, non-incremental TypeScript checking, the production build, and the smoke test in one command. `.github/workflows/ci.yml` runs the same checks plus a backup-script check on push and pull requests. All must pass before deployment. The `EditorLabels` issue found during this pass was fixed by making quick-action labels optional with safe fallbacks.

## CODE-READY / implemented in repo (inspected locally)

These items exist in the repo; they are not a production sign-off while the owner blockers remain open.

- **Local SQLite CMS:** `node:sqlite` `DatabaseSync`, WAL/foreign-key/busy-timeout pragmas, idempotent schema, and no migration-version table; no ORM. The current DB contains seeded CV-only profile, contact, social, skills, projects, certification, settings, admin credential, allowlist, and 8 synced public repositories.
- **Public UI:** explicit `/en` and `/ar` routes, layout-level direction, theme control, next-intl message catalogs, server-rendered CV-derived content, and explicit "pending" states for missing owner input.
- **Admin UI:** login page plus dashboard sections for overview, profile, skills, projects, certifications, contact, social links, GitHub, localization, preview, and settings.
- **Server-side authorization:** `requireAdminPage` for pages and `authorizeApi` for route handlers; signed session verification, password-session invalidation on credential change, numeric GitHub allowlist, and origin checks on mutations.
- **Local password login:** `npm run admin:password` writes a `scrypt` hash; SQLite-backed limiter allows 5 failed attempts per 15 minutes with `TRUST_PROXY` gating for forwarded IPs.
- **GitHub OAuth and sync:** state cookie, `read:user` scope, no `repo` scope, numeric-ID allowlist; server-side Axios sync with pagination (up to 10 pages), cache window, rate-limit handling, `last_sync_at`/`last_error`, and separate curated projects vs synced repository presentation.
- **Backup script:** `scripts/backup-db.mjs` uses `DatabaseSync` and `VACUUM INTO`, defaults to a timestamped file under `backups/`, accepts an explicit destination as `argv[2]`, redacts paths from errors, never prints env values, and exits nonzero on failure. Verified locally: created a 110,592-byte backup under `C:/Users/rts/AppData/Local/Temp/opencode`; `PRAGMA integrity_check` returned `ok`; 8 repositories were present; the temp backup was deleted.
- **Automated smoke tests:** `tests/smoke.test.mjs` runs with `npm test` using Node's built-in test runner against an isolated temp DB and generated secrets. It covers authorization, validation, login/session handling, content mutation, sync validation/cache, health, OAuth scope, logout, rate limiting, and locale direction/title/meta-description markers.
- **Health endpoint:** `/api/health` returns `200 { ok: true }` when the database is reachable and `503` otherwise, with no secrets exposed.
- **CMS row actions:** array editors now provide add, remove, move up/down, and visibility/publish toggles for projects, social links, certifications, skill groups and nested skills, in both languages; the structured JSON editor remains available for advanced edits.
- **Deployment guardrails:** `package.json` pins `engines.node >=24` for `node:sqlite`, `.env.example` documents optional read-only `GITHUB_TOKEN`, `.github/workflows/ci.yml` runs automated verification, and `docs/ADR-001-deployment.md` records the still-unapproved hosting decision.
- **Server error logging:** `src/instrumentation.ts` uses Next.js `onRequestError` to emit structured stderr JSON without logging headers, cookies, bodies, or query values. Hostinger Runtime Logs can ingest it; selecting an external alerting provider is still an owner/host decision.

## Owner decisions recorded 2026-11-25

- Default locale: **Arabic**; `/` redirects to `/ar`; `/en` remains available.
- i18n library: **next-intl** for all UI copy and locale routing; CMS content stays in SQLite. See `docs/ADR-002-i18n-library.md`.
- Production host: **Hostinger regular/shared hosting**, subject to Node.js Web Apps availability and a persistent SQLite path outside `hbuilds/`.
- Domain: **not purchased yet**; `SITE_URL` and the GitHub OAuth callback remain pending.
- Projects: **no Arabic translation**; titles and descriptions stay in English. GitHub-sourced descriptions are already English.
- About section: the CV-derived summary was translated to Arabic and approved by the owner.
