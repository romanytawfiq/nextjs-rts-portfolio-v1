import Link from "next/link";

import { ScrollProgress } from "@/components/scroll-progress";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

const sections = [
  { id: "about", key: "about" },
  { id: "skills", key: "skills" },
  { id: "projects", key: "projects" },
  { id: "github", key: "github" },
  { id: "certification", key: "certification" },
  { id: "contact", key: "contact" },
] as const;

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getDictionary(locale);
  const navItems = sections.map((section) => ({
    href: `/${locale}#${section.id}`,
    label: t.nav[section.key],
  }));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <ScrollProgress />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href={`/${locale}`}
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          RTS<span className="text-accent">.</span>
        </Link>

        <nav aria-label={t.nav.about} className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-full border border-line bg-surface p-0.5 text-xs"
            aria-label={t.languageLabel}
          >
            <Link
              href="/en"
              hrefLang="en"
              aria-current={locale === "en" ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "en" ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
              }`}
            >
              EN
            </Link>
            <Link
              href="/ar"
              hrefLang="ar"
              aria-current={locale === "ar" ? "true" : undefined}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                locale === "ar" ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground"
              }`}
            >
              AR
            </Link>
          </div>
          <ThemeToggle label={t.themeToggle} />
        </div>
      </div>

      <nav
        aria-label={t.nav.about}
        className="flex gap-5 overflow-x-auto border-t border-line px-5 py-3 md:hidden"
      >
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="whitespace-nowrap text-xs text-muted transition-colors hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
