import { z } from "zod";

import {
  isAllowedOrigin,
  recordPasswordLogin,
  setSessionCookie,
} from "@/lib/server/auth";
import {
  authenticatePassword,
  clearLoginFailures,
  isLoginLimited,
  loginRetryAfter,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  noteLoginFailure,
  USERNAME_PATTERN,
} from "@/lib/server/password";

const loginSchema = z.object({
  username: z.string().trim().regex(USERNAME_PATTERN),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

function clientIp(request: Request): string {
  // Only trust proxy-supplied IPs when the deployment explicitly says so, or
  // when the platform header is present. Otherwise a client could spoof the
  // header and start a fresh rate-limit bucket on every attempt.
  const trustedProxy =
    process.env.TRUST_PROXY === "1" || Boolean(request.headers.get("x-vercel-forwarded-for"));
  if (!trustedProxy) return "local";

  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

function attemptKey(request: Request, username: string): string {
  return `${clientIp(request)}:${username.trim().toLowerCase()}`;
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const username = parsed.data.username.trim();
  const password = parsed.data.password;
  const key = attemptKey(request, username);
  if (isLoginLimited(key)) {
    return Response.json(
      { error: "too_many_attempts" },
      { status: 429, headers: { "Retry-After": String(loginRetryAfter(key)) } },
    );
  }

  const authenticated = authenticatePassword(username, password);
  if (!authenticated) {
    noteLoginFailure(key);
    return Response.json({ error: "invalid_credentials" }, { status: 401 });
  }

  clearLoginFailures(key);
  await setSessionCookie({
    sub: 0,
    login: authenticated.username,
    method: "password",
    ver: authenticated.version,
  });
  recordPasswordLogin(authenticated.username);

  return Response.json({ ok: true });
}
