import type { NextRequest } from "next/server";

import {
  AUTH_LOCALE_COOKIE,
  normalizeAuthErrorCode,
  parseAuthLocale,
} from "@/lib/auth-error";

export async function GET(request: NextRequest) {
  const locale = parseAuthLocale(request.cookies.get(AUTH_LOCALE_COOKIE)?.value);

  // Emit a relative Location so the redirect cannot be pointed at a host
  // supplied by the caller. The browser resolves it on the canonical origin.
  const url = new URL(`/${locale}/admin/login`, "http://login.local");
  url.searchParams.set(
    "error",
    normalizeAuthErrorCode(
      request.nextUrl.searchParams.get("error"),
      request.nextUrl.searchParams.get("code"),
    ),
  );
  return new Response(null, {
    status: 307,
    headers: { Location: `${url.pathname}${url.search}` },
  });
}
