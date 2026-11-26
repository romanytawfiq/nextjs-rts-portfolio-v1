import createMiddleware from "next-intl/middleware";
import {NextResponse, type NextRequest} from "next/server";

import {routing} from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// next-intl owns locale negotiation and the root `/` → `/ar` redirect.
// The admin check below is only a signed-out UX pre-filter; every admin page
// and mutation still verifies the Auth.js session again on the server.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  if (response.ok) {
    const {pathname} = request.nextUrl;
    const isAdmin = /^\/(en|ar)\/admin(?:\/|$)/.test(pathname);
    const isLogin = pathname.endsWith("/admin/login");
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

    if (isAdmin && !isLogin && !hasSession) {
      const locale = pathname.startsWith("/ar/") ? "ar" : "en";
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
