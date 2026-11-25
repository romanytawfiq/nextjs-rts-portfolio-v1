import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { isOAuthConfigured, setOAuthState } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";
  const loginUrl = new URL(`/${locale}/admin/login`, request.url);

  if (!isOAuthConfigured()) {
    loginUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const state = `${randomBytes(24).toString("base64url")}.${locale}`;
  await setOAuthState(state);

  const origin = (process.env.SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/github/callback`);
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  return NextResponse.redirect(authorize.toString());
}
