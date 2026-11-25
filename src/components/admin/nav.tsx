"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n";

const items = [
  { key: "overview", segment: "" },
  { key: "profile", segment: "/profile" },
  { key: "contact", segment: "/contact" },
  { key: "social", segment: "/social-links" },
  { key: "skills", segment: "/skills" },
  { key: "projects", segment: "/projects" },
  { key: "certifications", segment: "/certifications" },
  { key: "github", segment: "/github" },
  { key: "localization", segment: "/localization" },
  { key: "settings", segment: "/settings" },
  { key: "preview", segment: "/preview" },
] as const;

export function AdminNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = useTranslations("Admin");
  const base = `/${locale}/admin`;

  return (
    <nav aria-label={t("shell.navLabel")} className="flex flex-wrap gap-1 px-3 pb-4 lg:flex-col">
      {items.map((item) => {
        const href = `${base}${item.segment}`;
        const active = item.segment === "" ? pathname === base : pathname.startsWith(`${href}/`) || pathname === href;

        return (
          <Link
            key={item.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent-soft font-medium text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {t(`nav.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
