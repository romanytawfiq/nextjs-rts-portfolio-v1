# Hostinger deployment guide

Status: **prepared, not executed**. `docs/ADR-001-deployment.md` records the owner's host selection. Do not deploy until the domain and credentials are ready.

## 1. Preconditions

- The purchased Hostinger plan includes **Node.js Web Apps**. If it does not, upgrade to a plan that does or use a Hostinger VPS; do not change the database architecture silently.
- A domain is purchased and assigned to the site. `SITE_URL` must be that exact `https://` origin.
- SSH access is available for creating the persistent data directory, setting the initial admin credential, and running backups.
- The Auth.js GitHub OAuth callback `https://<domain>/api/auth/callback/github` is registered in GitHub.

## 2. hPanel build settings

| Field | Value |
| --- | --- |
| Application type / framework | `next` |
| Node version | `24` |
| Package manager | `npm` |
| Build script | `build` |
| Output directory | `.next` |
| Entry file | leave empty (Hostinger starts the Next standalone server) |

Hostinger applies `output: "standalone"` automatically. Keep `next.config.ts` as an exported object; do not convert it to a function.

## 3. Persistent SQLite location

Hostinger overwrites `hbuilds/` and `public_html` on every deployment. Do **not** use the repo-local `.data/portfolio.sqlite` in production.

Create a directory outside the build:

```sh
mkdir -p ~/portfolio-data
chmod 700 ~/portfolio-data
```

Set the app environment variable:

```text
SQLITE_PATH=/home/<hosting-user>/portfolio-data/portfolio.sqlite
```

Replace `<hosting-user>` with the real SSH username. Verify after the first deploy that `/api/health` returns `{ "ok": true }`, then create one CMS change and confirm it survives a redeploy.

## 4. Environment variables in hPanel

Set these under **Environment variables**. They persist across deployments and are injected into both build and runtime. Never commit them or place them in `NEXT_PUBLIC_*`.

| Variable | Notes |
| --- | --- |
| `AUTH_SECRET` | Fresh production-only Auth.js value, at least 32 characters. Legacy `SESSION_SECRET` is accepted but do not use it for the new deployment. |
| `AUTH_TRUST_HOST` | Set to `1` so Auth.js trusts the forwarded public host. |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID. Legacy `GITHUB_CLIENT_ID` is accepted. |
| `AUTH_GITHUB_SECRET` | Regenerated secret; do not reuse the one previously exposed. Legacy `GITHUB_CLIENT_SECRET` is accepted. |
| `GITHUB_ADMIN_ID` | Stable numeric admin ID `232469937`. |
| `GITHUB_REPO_OWNER` | `romanytawfiq`. |
| `GITHUB_TOKEN` | Optional read-only token with **no** `repo` scope; leave empty to use anonymous GitHub rate limits. |
| `SITE_URL` | Approved production origin, e.g. `https://<domain>`. |
| `TRUST_PROXY` | Leave empty until Hostinger's proxy headers are verified. |
| `SQLITE_PATH` | Persistent path from section 3. |

## 5. Initial admin credential

Use a trusted checkout over SSH, pointed at the production DB, and enter the password interactively:

```sh
cd /path/to/trusted/checkout
SQLITE_PATH=/home/<hosting-user>/portfolio-data/portfolio.sqlite npm run admin:password
```

Use the exact same `SQLITE_PATH` as the running app: the script reads the shell environment and does not load `.env.local`. There is **one** local admin credential; rerunning the script replaces both username and password. The username printed by this command is the username to enter on the login page; an unmatched username or a different `SQLITE_PATH` is the most likely cause of an "incorrect password" message after creating a new admin credential. Do not pass the password as a command-line argument, do not paste it into chat, and do not reuse a previously exposed password. Changing it invalidates old password sessions.

## 6. Backups and restore drill

Schedule a cron job from a trusted checkout:

```sh
0 3 * * * cd /path/to/trusted/checkout && SQLITE_PATH=/home/<hosting-user>/portfolio-data/portfolio.sqlite node scripts/backup-db.mjs /home/<hosting-user>/backups/portfolio-$(date +\%F-\%H\%M).sqlite
```

Keep backups outside `hbuilds/`, `public_html`, and git. Before go-live, restore one backup to a separate file and verify:

```sh
PRAGMA integrity_check;
SELECT COUNT(*) FROM github_repos;
SELECT COUNT(*) FROM projects;
```

## 7. Monitoring

- Hostinger **Runtime Logs** shows the structured stderr line from `src/instrumentation.ts`.
- Hostinger **Monitoring** should target `https://<domain>/api/health`.
- Export logs if longer retention is needed; the runtime log buffer is per deployment and bounded.

## 8. Go-live checks

- [ ] `npm run verify` passes locally and in CI.
- [ ] `/` redirects to `/ar`; `/en` still works.
- [ ] `/api/health` returns `200 { ok: true }`.
- [ ] Password login works; GitHub sign-in works with the allowlisted ID; a non-allowlisted account is rejected.
- [ ] A CMS edit survives a redeploy (proves the SQLite path is durable).
- [ ] Backup and restore drill passes.
- [ ] No secret or backup file is inside the repo or `public_html`.
