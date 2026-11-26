import { isPasswordLoginConfigured } from "@/lib/server/password";

// Auth.js uses AUTH_SECRET. SESSION_SECRET is still accepted so existing local
// and VPS environments keep working while the deployment is migrated.
export function authSecret(): string | null {
  const secret = process.env.AUTH_SECRET ?? process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
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
