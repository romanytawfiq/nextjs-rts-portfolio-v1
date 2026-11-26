"use server";

import { cookies } from "next/headers";

import { signIn } from "@/auth";
import { AUTH_LOCALE_COOKIE } from "@/lib/auth-error";
import { defaultLocale, isLocale } from "@/lib/i18n";

export async function signInWithGitHub(formData: FormData) {
  const requested = String(formData.get("locale") ?? "");
  const locale = isLocale(requested) ? requested : defaultLocale;

  // Auth.js error redirects are static routes. Remember the requested locale so
  // the error page can return the visitor to the right admin login page.
  (await cookies()).set(AUTH_LOCALE_COOKIE, locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  await signIn("github", { redirectTo: `/${locale}/admin` });
}
