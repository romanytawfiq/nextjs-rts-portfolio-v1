import { getDb } from "@/lib/server/db";

export function recordLogin(session: { sub: number; login: string }) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO admin_allowlist (github_id, login, enabled, created_at, last_login_at)
     VALUES (?, ?, 1, ?, ?)
     ON CONFLICT(github_id) DO UPDATE SET login = excluded.login,
       enabled = 1, last_login_at = excluded.last_login_at`,
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
  ).run(username, now);
}
