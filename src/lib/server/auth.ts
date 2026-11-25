import { createHmac, timingSafeEqual } from "node:crypto";

import { cacheLife } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/lib/server/db";
import { getPasswordCredential } from "@/lib/server/password";

const SESSION_COOKIE = "rts_session";
const STATE_COOKIE = "rts_oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionMethod = "github" | "password";

export type Session = {
  sub: number;
  login: string;
  method: SessionMethod;
  ver: string;
  exp: number;
};

function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function allowedAdminId(): number | null {
  const raw = process.env.GITHUB_ADMIN_ID?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export function isOAuthConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      sessionSecret() &&
      allowedAdminId(),
  );
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(input: {
  sub: number;
  login: string;
  method: SessionMethod;
  ver: string;
}) {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is missing or too short");
  const payload: Session = {
    sub: input.sub,
    login: input.login,
    method: input.method,
    ver: input.ver,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `v1.${encoded}.${sign(encoded, secret)}`;
}

function verifySessionToken(token: string | undefined): Session | null {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const expected = sign(parts[1], secret);
  const actual = parts[2];
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Session).sub !== "number" ||
      typeof (parsed as Session).login !== "string" ||
      ((parsed as Session).method !== "github" &&
        (parsed as Session).method !== "password") ||
      typeof (parsed as Session).ver !== "string" ||
      typeof (parsed as Session).exp !== "number"
    ) {
      return null;
    }
    return parsed as Session;
  } catch {
    return null;
  }
}

async function readSession(): Promise<Session | null> {
  const session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session || session.exp <= Date.now()) return null;

  if (session.method === "password") {
    const credential = getPasswordCredential();
    if (
      !credential?.enabled ||
      credential.username.toLowerCase() !== session.login.toLowerCase() ||
      credential.version !== session.ver
    ) {
      return null;
    }
    return session;
  }

  const allowed = allowedAdminId();
  if (allowed === null || session.sub !== allowed) return null;

  const row = getDb()
    .prepare("SELECT enabled FROM admin_allowlist WHERE github_id = ?")
    .get(session.sub);
  if (!row || Number((row as { enabled: unknown }).enabled) !== 1) return null;

  return session;
}

export async function getSession(): Promise<Session | null> {
  "use cache: private";
  // Auth state must not stay fresh forever in the browser router after logout
  // or password changes. "seconds" keeps only a 30s client stale window.
  cacheLife("seconds");
  return readSession();
}

// Route Handlers cannot use private cache functions; they read the same cookie
// directly at request time.
export async function getSessionForRoute(): Promise<Session | null> {
  return readSession();
}

export async function setSessionCookie(input: {
  sub: number;
  login: string;
  method: SessionMethod;
  ver: string;
}) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(input), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function setOAuthState(state: string) {
  (await cookies()).set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

export async function consumeOAuthState(value: string): Promise<boolean> {
  const store = await cookies();
  const stored = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  return Boolean(stored && stored.length === value.length && timingSafeEqual(Buffer.from(stored), Buffer.from(value)));
}

export async function requireAdminPage(locale: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return session;
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "::1" || /^127\.\d+\.\d+\.\d+$/.test(host);
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const received = origin.replace(/\/$/, "");
  const requestUrl = new URL(request.url);
  const allowed = new Set<string>([requestUrl.origin]);

  let configured: URL | null = null;
  try {
    configured = process.env.SITE_URL ? new URL(process.env.SITE_URL) : null;
  } catch {
    configured = null;
  }
  if (configured) {
    allowed.add(configured.origin);

    // Next can normalize request.url to SITE_URL even when the browser used a
    // loopback alias. Allow only the same loopback aliases, never an arbitrary
    // Host header supplied by a caller.
    if (isLoopbackHost(configured.hostname)) {
      const port = configured.port ? `:${configured.port}` : "";
      for (const alias of ["localhost", "127.0.0.1", "[::1]"]) {
        allowed.add(`${configured.protocol}//${alias}${port}`);
      }
    }
  }

  return allowed.has(received);
}

export async function authorizeApi(
  request: Request,
): Promise<{ ok: true; session: Session } | { ok: false; response: Response }> {
  if (!isAllowedOrigin(request)) {
    return {
      ok: false,
      response: Response.json({ error: "invalid_origin" }, { status: 403 }),
    };
  }

  const session = await getSessionForRoute();
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

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
