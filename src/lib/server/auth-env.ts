import { isPasswordLoginConfigured } from "@/lib/server/password";

// Auth.js uses AUTH_SECRET. SESSION_SECRET is still accepted so existing local
// and VPS environments keep working while the deployment is migrated.
export function authSecret(): string | null {
  // Check both candidates by length: a short AUTH_SECRET must not suppress a
  // valid legacy SESSION_SECRET.
  const candidates = [process.env.AUTH_SECRET, process.env.SESSION_SECRET];
  return candidates.find((secret) => Boolean(secret && secret.length >= 32)) ?? null;
}

// Pass this to Auth.js so it can never fall back to a raw/legacy environment
// variable that bypasses our length policy.
export function requireAuthSecret(): string {
  const secret = authSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET (or SESSION_SECRET) must be at least 32 characters.");
  }
  return secret;
}

export function allowedAdminId(): number | null {
  const raw = process.env.GITHUB_ADMIN_ID?.trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

export function githubCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isOAuthConfigured(): boolean {
  return Boolean(authSecret() && githubCredentials() && allowedAdminId());
}

export function isPasswordAuthConfigured(): boolean {
  return Boolean(authSecret() && isPasswordLoginConfigured());
}
