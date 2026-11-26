import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import { loginSchema } from "@/lib/auth-validation";
import {
  allowedAdminId,
  authSecret,
  githubCredentials,
} from "@/lib/server/auth-env";
import { recordLogin, recordPasswordLogin } from "@/lib/server/audit";
import {
  authenticatePassword,
  clearLoginFailures,
  isLoginLimited,
  isPasswordLoginConfigured,
  noteLoginFailure,
} from "@/lib/server/password";
import { clientIp, isAllowedOrigin } from "@/lib/server/request-origin";

// Auth.js reads AUTH_URL. SITE_URL is the existing canonical-origin variable,
// so use it as a compatibility alias instead of asking for two values.
if (!process.env.AUTH_URL && process.env.SITE_URL) {
  process.env.AUTH_URL = process.env.SITE_URL;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

class PasswordSignInError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function attemptKey(request: Request, username: string): string {
  return `${clientIp(request)}:${username.trim().toLowerCase()}`;
}

function githubLogin(
  profile: { login?: unknown; name?: unknown } | undefined,
  user: { name?: string | null } | undefined,
): string | null {
  if (typeof profile?.login === "string" && profile.login) return profile.login;
  if (typeof profile?.name === "string" && profile.name) return profile.name;
  return user?.name ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret() ?? undefined,
  trustHost: process.env.AUTH_TRUST_HOST === "1" || process.env.NODE_ENV !== "production",
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: {
    signIn: "/api/auth/error-page",
    error: "/api/auth/error-page",
  },
  providers: [
    GitHub({
      clientId: githubCredentials()?.clientId ?? "",
      clientSecret: githubCredentials()?.clientSecret ?? "",
      authorization: {
        params: { scope: "read:user", allow_signup: "false" },
      },
    }),
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        if (!authSecret() || !isPasswordLoginConfigured()) {
          throw new PasswordSignInError("not_configured");
        }
        if (!isAllowedOrigin(request)) {
          throw new PasswordSignInError("invalid_origin");
        }

        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) {
          throw new PasswordSignInError("invalid_payload");
        }

        const username = parsed.data.username.trim();
        const key = attemptKey(request, username);
        if (isLoginLimited(key)) {
          throw new PasswordSignInError("too_many_attempts");
        }

        const authenticated = authenticatePassword(username, parsed.data.password);
        if (!authenticated) {
          noteLoginFailure(key);
          throw new PasswordSignInError("invalid_credentials");
        }

        clearLoginFailures(key);
        recordPasswordLogin(authenticated.username);
        return {
          id: "0",
          name: authenticated.username,
          login: authenticated.username,
          githubId: 0,
          method: "password" as const,
          ver: authenticated.version,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return user.method === "password";
      }

      if (account?.provider === "github") {
        const allowed = allowedAdminId();
        const rawId = account.providerAccountId ?? (profile?.id != null ? String(profile.id) : "");
        if (allowed === null || !/^\d+$/.test(rawId) || Number(rawId) !== allowed) {
          return false;
        }
        const login = githubLogin(profile, user);
        if (!login) return false;
        recordLogin({ sub: allowed, login });
        return true;
      }

      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "github") {
        const rawId = account.providerAccountId ?? (profile?.id != null ? String(profile.id) : "");
        const githubId = /^\d+$/.test(rawId) ? Number(rawId) : 0;
        token.sub = String(githubId);
        token.githubId = githubId;
        token.login = githubLogin(profile, user) ?? token.login ?? "";
        token.method = "github";
        token.ver = "";
        return token;
      }

      if (account?.provider === "credentials") {
        token.sub = "0";
        token.githubId = 0;
        token.login = user.login ?? user.name ?? token.login ?? "";
        token.method = "password";
        token.ver = user.ver ?? "";
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub ?? "0",
        githubId: typeof token.githubId === "number" ? token.githubId : Number(token.sub ?? 0),
        login: typeof token.login === "string" ? token.login : "",
        method: token.method === "password" ? "password" : "github",
        ver: typeof token.ver === "string" ? token.ver : "",
      };
      return session;
    },
  },
});
