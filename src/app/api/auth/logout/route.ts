import { NextResponse, type NextRequest } from "next/server";

import { clearSessionCookie, isAllowedOrigin } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  await clearSessionCookie();
  const locale = request.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";
  // 303 makes the browser follow with GET after this POST form submission.
  // A 307 would re-POST to the login page.
  return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), { status: 303 });
}
