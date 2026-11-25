import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";

import {
  allowedAdminId,
  consumeOAuthState,
  recordLogin,
  setSessionCookie,
} from "@/lib/server/auth";

type GitHubUser = { id: number; login: string };

function fail(request: NextRequest, code: string) {
  const url = new URL("/en/admin/login", request.url);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code || !state) return fail(request, "oauth_denied");
  if (!(await consumeOAuthState(state))) return fail(request, "invalid_state");

  const allowed = allowedAdminId();
  if (allowed === null) return fail(request, "not_configured");

  const origin = (process.env.SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");

  try {
    const tokenResponse = await axios.post<{ access_token?: string; error?: string }>(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/github/callback`,
      },
      {
        headers: { Accept: "application/json", "User-Agent": "rts-portfolio" },
        timeout: 10_000,
      },
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return fail(request, "token_exchange_failed");

    const userResponse = await axios.get<GitHubUser>("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "rts-portfolio",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      timeout: 10_000,
    });

    const { id, login } = userResponse.data;
    if (!Number.isInteger(id) || !login || id !== allowed) {
      return fail(request, "forbidden");
    }

    recordLogin({ sub: id, login });
    await setSessionCookie({ sub: id, login, method: "github", ver: "" });

    const locale = state.split(".").at(-1) === "ar" ? "ar" : "en";
    return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
  } catch {
    return fail(request, "oauth_failed");
  }
}
