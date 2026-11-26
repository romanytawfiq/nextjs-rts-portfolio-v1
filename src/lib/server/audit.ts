import { getDb } from "@/lib/server/db";

export function recordLogin(session: { sub: number; login: string }) {
  const db = getDb();
  const now = new Date().toISOString();
  // Do not set `enabled` here: audit logging must never restore a revoked
  // GitHub admin. A new row is created only on genuine first sign-in.
  db.prepare(
    `INSERT INTO admin_allowlist (github_id, login, enabled, created_at, last_login_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(github_id) DO UPDATE SET login = excluded.login,
       last_login_at = excluded.last_login_at`,
  ).run(session.sub, session.login, now, now);
  db.prepare(
    "INSERT INTO audit_events (github_id, action, detail, created_at) VALUES (?, 'auth.login', ?, ?)",
  ).run(session.sub, session.login, now);
}

export function recordPasswordLogin(username: string) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE admin_credentials SET last_login_at = ? WHERE id = 1").run(now);
  db.prepare(
    "INSERT INTO audit_events (github_id, action, detail, created_at) VALUES (NULL, 'auth.login.password', ?, ?)",
  ).run(`username:${username}`, now);
}

export function recordLoginFailure(username: string, source: string, userAgent = "") {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO audit_events (github_id, action, detail, created_at) VALUES (NULL, 'auth.login.failed', ?, ?)",
  ).run(
    `username:${username}; source:${source}; user_agent:${userAgent.slice(0, 200)}`,
    now,
  );
}

export function recordDeniedGithubLogin(githubId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO audit_events (github_id, action, detail, created_at) VALUES (NULL, 'auth.login.denied', ?, ?)",
  ).run(`provider:github; github_id:${githubId}`, now);
}
