"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n";

export function AdminTopbar({ locale, login }: { locale: Locale; login: string }) {
  const t = useTranslations("Admin");
  const pathname = usePathname() || `/${locale}/admin`;
  const rest = pathname.replace(/^\/(en|ar)/, "") || "/admin";
  const otherLocale = locale === "en" ? "ar" : "en";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="grid gap-0.5">
          <span className="text-xs text-muted">{t("shell.viewer")}</span>
          <span className="text-sm font-medium">@{login}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${otherLocale}${rest}`}
            hrefLang={otherLocale}
            className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {otherLocale === "en" ? t("common.english") : t("common.arabic")}
          </Link>
          <Link
            href={`/${locale}`}
            className="hidden rounded-lg border border-line px-3 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            {t("shell.viewSite")}
          </Link>
          <ThemeToggle label={t("shell.theme")} />
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void signOut({ callbackUrl: `/${locale}/admin/login` });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {t("shell.signOut")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
