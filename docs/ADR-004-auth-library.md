# ADR-004 — Authentication library and session strategy

- **Status:** Approved by owner on 2026-11-26; implemented
- **Date:** 2026-11-26
- **Scope:** admin sign-in, OAuth provider handling, session cookies, authorization wrappers
- **Related:** `docs/PROJECT_SPEC.md` §7A/§15.12, `docs/ADR-001-deployment.md`, `docs/HOSTINGER_DEPLOYMENT.md`

## Context

The owner asked to replace the hand-written login flow with an OAuth library while keeping two sign-in methods: the owner's GitHub account and the local username/password admin account. The repository uses Next.js 16.4.6 and Node's built-in `node:sqlite`; no ORM is in use. The durable SQLite file is on a VPS/Hostinger Node.js host, not an ephemeral serverless filesystem.

Requirements carried forward from the baseline spec:

- Stable numeric GitHub allowlist: `232469937`.
- GitHub scope limited to `read:user`; no `repo` scope.
- Server-side authorization on every admin page and mutation.
- Fail closed when no secret or login method is configured.
- Keep password hashing, audit history and the SQLite-backed login limiter.

## Decision

Use `next-auth@5.0.0-beta.32` (Auth.js v5 beta) because it supports Next 16 and provides both a GitHub OAuth provider and a Credentials provider. The owner approved this choice on 2026-11-26 after it was selected for implementation.

Configuration lives in `src/auth.ts`:

- `GitHub` provider with `scope=read:user` and `allow_signup=false`.
- `Credentials` provider that keeps the existing scrypt verification, username validation, SQLite rate limiter and audit events.
- `callbacks.signIn` rejects GitHub accounts whose numeric ID is not `GITHUB_ADMIN_ID`.
- JWT session strategy with a 7-day maximum age. No session tables or adapter are added.
- Encrypted Auth.js session cookies replace the old `rts_session` HMAC cookie.
- Auth.js error redirects are mapped to the existing owner-approved `next-intl` login messages; no new Arabic copy was invented.

`src/lib/server/auth.ts` keeps the existing `getSession`, `requireAdminPage` and `authorizeApi` surface. It reads the Auth.js session, then revalidates it against SQLite on every request so password rotation and allowlist changes still invalidate sessions. Proxy/middleware remains a signed-out UX pre-filter only.

## Environment and callback

- Primary secret: `AUTH_SECRET` (≥32 characters). `SESSION_SECRET` remains accepted as a migration alias.
- Primary GitHub variables: `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. The old `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` names are aliases.
- `AUTH_TRUST_HOST=1` is required on the VPS/Hostinger host. `AUTH_URL` defaults to `SITE_URL`.
- Registered callback: `<SITE_URL>/api/auth/callback/github`.

## Consequences

- Auth.js now owns CSRF tokens, OAuth state/PKCE handling, cookie encryption and sign-out.
- The password limiter no longer returns a JSON `429`; failed and limited attempts return an Auth.js error code that the login UI maps to existing messages. The wait window remains 15 minutes.
- `proxy.ts` checks Auth.js cookie names but is not an authorization boundary.
- Smoke tests exercise Auth.js CSRF, password callback, GitHub authorization URL, logout, CMS authorization and the limiter against a production build.
- A real browser GitHub sign-in, non-allowlisted rejection, credential rotation and host-specific `AUTH_TRUST_HOST` verification remain production blockers.
