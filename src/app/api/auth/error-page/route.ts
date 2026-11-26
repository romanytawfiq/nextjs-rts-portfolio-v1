import { NextResponse, type NextRequest } from "next/server";

import {
  AUTH_LOCALE_COOKIE,
  normalizeAuthErrorCode,
  parseAuthLocale,
} from "@/lib/auth-error";

export async function GET(request: NextRequest) {
  const locale = parseAuthLocale(request.cookies.get(AUTH_LOCALE_COOKIE)?.value);
  const url = new URL(`/${locale}/admin/login`, request.url);
  url.searchParams.set(
    "error",
    normalizeAuthErrorCode(
      request.nextUrl.searchParams.get("error"),
      request.nextUrl.searchParams.get("code"),
    ),
  );
  return NextResponse.redirect(url);
}
