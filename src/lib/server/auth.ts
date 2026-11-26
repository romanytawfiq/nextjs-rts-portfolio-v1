import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/auth";
import {
  allowedAdminId,
  authSecret,
  isOAuthConfigured,
  isPasswordAuthConfigured,
} from "@/lib/server/auth-env";
import type { AdminSession } from "@/lib/server/auth-types";
import { getDb } from "@/lib/server/db";
import { getPasswordCredential } from "@/lib/server/password";
import { isAllowedOrigin } from "@/lib/server/request-origin";

export type Session = AdminSession;

export { isOAuthConfigured, isPasswordAuthConfigured };

// Auth.js owns the encrypted session cookie. This wrapper keeps the existing
// page/API authorization surface while revalidating identity against SQLite on
// every request, so password rotation and allowlist changes still take effect.
async function readSessionUncached(): Promise<Session | null> {
  if (!authSecret()) return null;

  const authSession = await auth();
  const user = authSession?.user;
  if (!user || typeof user.login !== "string" || !user.login) return null;
  if (user.method !== "github" && user.method !== "password") return null;
  if (!Number.isInteger(user.githubId)) return null;

  const expires = Date.parse(authSession.expires);
  if (!Number.isFinite(expires) || expires <= Date.now()) return null;

  const session: Session = {
    sub: user.githubId,
    login: user.login,
    method: user.method,
    ver: user.ver,
    exp: expires,
  };

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

// Auth.js creates a CSRF token even for a session read. That uses
// crypto.getRandomValues(), which Cache Components cannot prerender. Defer the
// whole page session read to request time; the admin loading boundary provides
// the Suspense fallback.
// React cache deduplicates the session check between the dashboard layout and
// a page in the same render. It is request-scoped, so revocation still applies
// to the next navigation.
const readSession = cache(async (): Promise<Session | null> => {
  await connection();
  return readSessionUncached();
});

export async function getSession(): Promise<Session | null> {
  return readSession();
}

// Route Handlers already run per request and have no static shell, so they do
// not need connection(); auth() still reads the cookie at request time.
async function getSessionForRoute(): Promise<Session | null> {
  return readSessionUncached();
}

export async function requireAdminPage(locale: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return session;
}

export async function authorizeApi(
  request: Request,
): Promise<{ ok: true; session: Session } | { ok: false; response: Response }> {
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());
  if (!isAllowedOrigin(request, isMutation)) {
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
