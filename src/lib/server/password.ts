import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

import { getDb } from "@/lib/server/db";

const KEY_LENGTH = 64;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,64}$/;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

// A well-formed dummy hash keeps failed logins closer in cost to successful
// ones when no local admin account has been configured yet.
const DUMMY_HASH = `scrypt$${"0".repeat(32)}${"0".repeat(128)}`;

export type PasswordCredential = {
  username: string;
  passwordHash: string;
  version: string;
  enabled: boolean;
};

function versionForHash(hash: string): string {
  return createHash("sha256").update(hash).digest("hex").slice(0, 32);
}

export function verifyPassword(password: string, stored: string): boolean {
  const [prefix, salt, hash] = stored.split("$");
  if (
    prefix !== "scrypt" ||
    !salt ||
    !/^[0-9a-f]{32}$/.test(salt) ||
    !hash ||
    !/^[0-9a-f]{128}$/.test(hash)
  ) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function getPasswordCredential(): PasswordCredential | null {
  const row = getDb()
    .prepare(
      "SELECT username, password_hash, auth_version, enabled FROM admin_credentials WHERE id = 1",
    )
    .get();
  if (!row) return null;

  const record = row as Record<string, unknown>;
  const passwordHash = String(record.password_hash ?? "");
  return {
    username: String(record.username ?? ""),
    passwordHash,
    version: String(record.auth_version ?? "") || versionForHash(passwordHash),
    enabled: Number(record.enabled ?? 0) === 1,
  };
}

export function isPasswordLoginConfigured(): boolean {
  return Boolean(getPasswordCredential()?.enabled);
}

// SQLite-backed so every process sharing the database sees the same failures.
// A per-process Map allowed a caller to bypass the limit by hitting another
// instance. For a hosted multi-instance deployment this table must live on the
// same durable database as the rest of the CMS.
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_LOGIN_ATTEMPTS = 5;

export function isLoginLimited(key: string, now: number = Date.now()): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT count, reset_at FROM auth_login_attempts WHERE attempt_key = ?")
    .get(key) as { count: number; reset_at: number } | undefined;
  if (!row) return false;

  const resetAt = Number(row.reset_at);
  if (!Number.isFinite(resetAt) || resetAt <= now) {
    db.prepare("DELETE FROM auth_login_attempts WHERE attempt_key = ?").run(key);
    return false;
  }
  return Number(row.count) >= MAX_LOGIN_ATTEMPTS;
}

export function loginRetryAfter(key: string, now: number = Date.now()): number {
  const row = getDb()
    .prepare("SELECT reset_at FROM auth_login_attempts WHERE attempt_key = ?")
    .get(key) as { reset_at: number } | undefined;
  const resetAt = Number(row?.reset_at ?? now + LOGIN_WINDOW_MS);
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}

export function noteLoginFailure(key: string, now: number = Date.now()): void {
  const db = getDb();
  const windowEnd = now + LOGIN_WINDOW_MS;
  db.prepare("DELETE FROM auth_login_attempts WHERE reset_at <= ?").run(now);
  db.prepare(
    `INSERT INTO auth_login_attempts (attempt_key, count, reset_at)
     VALUES (?, 1, ?)
     ON CONFLICT(attempt_key) DO UPDATE SET
       count = CASE WHEN auth_login_attempts.reset_at <= ? THEN 1
                    ELSE auth_login_attempts.count + 1 END,
       reset_at = CASE WHEN auth_login_attempts.reset_at <= ? THEN ?
                       ELSE auth_login_attempts.reset_at END`,
  ).run(key, windowEnd, now, now, windowEnd);
}

export function clearLoginFailures(key: string): void {
  getDb().prepare("DELETE FROM auth_login_attempts WHERE attempt_key = ?").run(key);
}

export function authenticatePassword(
  username: string,
  password: string,
): { username: string; version: string } | null {
  const credential = getPasswordCredential();
  const passwordMatches = verifyPassword(
    password,
    credential?.enabled ? credential.passwordHash : DUMMY_HASH,
  );
  const normalized = username.trim().toLowerCase();

  if (
    !credential?.enabled ||
    credential.username.toLowerCase() !== normalized ||
    !passwordMatches
  ) {
    return null;
  }
  return { username: credential.username, version: credential.version };
}
