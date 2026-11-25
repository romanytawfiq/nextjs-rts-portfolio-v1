# ADR-001 — Production deployment and SQLite topology

- **Status:** Conditionally approved — Hostinger selected; Node.js plan and persistent SQLite path still need verification
- **Date:** 2026-11-25
- **Scope:** host, durable SQLite topology, runtime, backups/restore, migrations, environment variables, monitoring, rate-limiter scope
- **Related:** `AGENTS.md`, `docs/PROJECT_SPEC.md` §12, `docs/PRODUCTION_CHECKLIST.md`, `docs/HOSTINGER_DEPLOYMENT.md`

This is a decision-record template. The recommendation below is a proposal, not an approved decision.

## Context — confirmed repo facts

- Development uses a local SQLite file at `.data/portfolio.sqlite` (with WAL/SHM files) through `node:sqlite` `DatabaseSync`. No ORM is selected or embedded.
- Local runtime verified: Node `v24.20.0`. The code imports built-in `node:sqlite`.
- `.env.example` lists `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ADMIN_ID`, `GITHUB_REPO_OWNER`, `SITE_URL`, `TRUST_PROXY`, and `SQLITE_PATH`. `scripts/set-admin-password.mjs` also accepts one-time `ADMIN_USERNAME`/`ADMIN_PASSWORD` inputs and stores only a `scrypt` hash. `src/lib/server/github.ts` optionally uses a server-only `GITHUB_TOKEN`.
- `src/lib/server/db.ts` creates the schema idempotently, has no migration-version table, and has no migration CLI.
- `scripts/backup-db.mjs` makes a consistent snapshot with SQLite `VACUUM INTO`, defaulting to a timestamped file under `backups/`, and exits nonzero on failure.
- Login failures are stored in `auth_login_attempts`: 5 attempts per 15 minutes, keyed by trusted client IP plus username. `TRUST_PROXY=1` or a Vercel forwarded header is required before `X-Forwarded-For` is trusted; otherwise the bucket is `local`.
- The CV lists a Vercel-hosted portfolio URL, but `docs/PROJECT_SPEC.md` treats Vercel as a working assumption only. The owner has now selected **Hostinger regular/shared hosting** instead.
- Hostinger's current docs (checked 2026-11-25) state that managed Node.js Web Apps support Node 18/20/22/24, run Next.js in standalone server mode, inject environment variables that persist across deployments, and capture stdout/stderr in Runtime Logs.
- Hostinger deploys Node apps into `hbuilds/current/nodejs`; `hbuilds/` and `public_html` are overwritten on every deployment. A SQLite file inside the build directory is therefore **not durable**.
- Hostinger Node.js processes run on demand and stop after inactivity; the next request restarts the app. Treat this as a cold-start constraint, not an always-on process guarantee.

## Decision recorded

The owner selected **Hostinger regular/shared hosting** on 2026-11-25. Vercel/Turso is no longer the planned path. The remaining work is to verify the plan and durable-storage details below before production release.

### Selected option — Hostinger Node.js Web Apps

- The Hostinger plan must include **Node.js Web Apps** (available on Business web/cloud plans per current Hostinger material). If the purchased plan does not include it, upgrade or use a Hostinger VPS; do not silently change the architecture.
- Application type: `next`; build script: `build`; output directory: `.next`. Hostinger applies `output: "standalone"` automatically and Node 24 is supported.
- Keep the current no-ORM `node:sqlite` implementation, but set `SQLITE_PATH` to a persistent writable directory **outside `hbuilds/`**, such as `/home/<user>/portfolio-data/portfolio.sqlite`.
- Verify write access and WAL/SHM behavior for that directory before deploying content.
- Domain is not purchased yet; `SITE_URL` and the GitHub OAuth callback remain pending.

### Superseded option — Vercel + Turso/libSQL

- Not selected. It would require a new adapter/driver review, managed-service secrets, backup/restore validation, and cost approval. Do not revisit it unless the owner changes the decision in a new ADR.

## Implementation notes for the approved option

### Runtime

- Select **Node 24** in hPanel build settings; the code imports `node:sqlite` and Node 24.20.0 is the locally verified version.
- Hostinger auto-applies Next.js standalone output; `next.config.ts` remains a supported TypeScript config. It now exports `withNextIntl(nextConfig)`, preserving `cacheComponents`, `partialPrefetching`, and the Tailwind Turbopack rule.
- Expect cold starts after inactivity; keep health checks and the first-request path lightweight.
- Keep public and admin routes server-authorized; UI hiding is never the security boundary.

### Backups and restore

- Use `node scripts/backup-db.mjs`. It defaults to `backups/portfolio-<timestamp>.sqlite`, or accepts an explicit destination path as `argv[2]`.
- On Hostinger, run it via SSH/cron against the same persistent `SQLITE_PATH` and write snapshots to a directory outside `hbuilds/` and outside the public docroot.
- The script uses `VACUUM INTO`, which produces a transactionally consistent snapshot including committed WAL content; do not treat loose `.sqlite`, `-wal`, and `-shm` files as a finished backup.
- The script never prints env values, redacts paths from errors, and exits nonzero on failure.
- Before production approval, define schedule, retention, off-host copy, and a documented restore drill: restore to a separate file, run `PRAGMA integrity_check`, verify expected table counts, then promote only after owner-approved verification.
- Keep backups encrypted/access-controlled; no backup or secret belongs in git or `public_html`.

### Migrations

- The current `getDb()` applies schema idempotently, drops any legacy `schema_migrations` table on first open, and has no standalone migration command or version table.
- Before production, choose and document either a migration runner or a controlled manual process compatible with the selected host/adapter.
- Take a verified backup before each migration; record how to roll back or restore; test migrations on staging before production.
- Never seed invented personal facts. Current seed data is CV-derived only.

### Environment variables

- Server-only: `SESSION_SECRET` (at least 32 characters), `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ADMIN_ID`, `GITHUB_REPO_OWNER`, `SITE_URL`, `TRUST_PROXY`, `SQLITE_PATH`, and optional `GITHUB_TOKEN`.
- One-time setup only: `ADMIN_USERNAME` and `ADMIN_PASSWORD` for `npm run admin:password`; only the generated hash is stored.
- Set these in **hPanel → Environment variables**, not in a committed `.env` file. Hostinger injects them into both build and runtime and preserves them across deployments.
- `SQLITE_PATH` must be the persistent path outside `hbuilds/`; do not rely on the repo-local `.data/portfolio.sqlite` after a deployment.
- Secrets must never be placed in `NEXT_PUBLIC_*` or committed. Rotate the exposed GitHub client secret, set a fresh local admin password, and use a fresh `SESSION_SECRET` before release.
- `SITE_URL` must be the approved production origin once the domain is purchased; the GitHub OAuth callback is `<SITE_URL>/api/auth/github/callback`.

### Monitoring

- The app stores GitHub sync `last_sync_at`/`last_error` and `audit_events` in SQLite, visible through the admin UI.
- `src/instrumentation.ts` emits structured stderr JSON through Next.js `onRequestError`. It records method, sanitized path, route context, and error message/digest, but never headers, cookies, request bodies, or query values.
- `/api/health` returns `200` when the database is reachable and `503` otherwise; use it for host health checks.
- `.github/workflows/ci.yml` runs lint, non-incremental typecheck, build, smoke tests, and a backup-script check on every push/PR.
- Use Hostinger **Runtime Logs** for stdout/stderr and **Monitoring** for availability alerts; `/api/health` is the health-check target. Logs are per-deployment and bounded, so export them if longer retention is required.
- Add disk-usage/backup-failure alerts for the persistent `SQLITE_PATH` once the Hostinger account details are known.
- No external monitoring/alerting provider is configured in this repo; adding one remains an owner decision if Hostinger tools are insufficient.

### Rate limiter scope

- Current built-in limiter covers **local password login only**: 5 failed attempts per 15 minutes per trusted-IP-and-username key, stored in `auth_login_attempts`.
- The attempts table lives in the same SQLite database as the CMS, so it persists across Hostinger cold starts and deployments as long as `SQLITE_PATH` is durable.
- `TRUST_PROXY` must be enabled only behind a trusted reverse proxy; direct access uses a single `local` bucket. Hostinger's proxy configuration must be confirmed before enabling it.
- GitHub OAuth start/callback uses a one-time `state` cookie but has no dedicated request limiter. Edge/proxy rate limiting for auth endpoints and any future public mutation endpoints must be defined for the chosen host.

## Consequences

- **Hostinger:** minimal code change and no new database adapter, but requires verifying Node.js Web Apps availability, a persistent writable `SQLITE_PATH` outside `hbuilds/`, backup automation, and cold-start behavior.
- **Vercel/Turso (superseded):** would require a new adapter/driver review, managed-service secrets, backup/restore validation, and cost approval.
- The domain/OAuth callback, credential rotation, remaining CV-approved content/assets, and real interactive GitHub sign-in are still required before release. Default locale and project translation scope are resolved.

## Open questions — Pending owner input

1. Does the purchased Hostinger plan include Node.js Web Apps?
2. What is the persistent writable `SQLITE_PATH` outside `hbuilds/`, and who owns backup/restore operations?
3. What is the production origin and registered GitHub OAuth callback once the domain is purchased?
4. Are Hostinger Runtime Logs + Monitoring sufficient, or is an external provider required?
5. What backup retention and restore-test cadence is required?
6. Is edge/proxy rate limiting needed for OAuth endpoints before release?

## Approval

- [x] Owner selects host: Hostinger regular/shared hosting (2026-11-25).
- [ ] Owner confirms the plan includes Node.js Web Apps and Node 24.
- [ ] Owner approves domain, OAuth callback, and credential-rotation plan.
- [ ] Owner approves persistent `SQLITE_PATH`, backup/restore, migration, monitoring, and rate-limiter scope notes.
- [x] Owner records approval date: 2026-11-25

**Host selection is recorded, but deployment remains blocked until unchecked boxes are completed.**
