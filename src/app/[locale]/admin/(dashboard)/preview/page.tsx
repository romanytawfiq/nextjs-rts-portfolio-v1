import Link from "next/link";

import { AdminCard, AdminPageHeader } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminPreviewPage({
  params,
}: PageProps<"/[locale]/admin/preview">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.preview;

  const cards = [
    { key: "englishCard", href: "/en", description: "en", badge: c.common.english },
    { key: "arabicCard", href: "/ar", description: "ar", badge: c.common.arabic },
    { key: "lightCard", href: "/en", description: "en", badge: c.common.light },
    { key: "darkCard", href: "/ar", description: "ar", badge: c.common.dark },
  ] as const;

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} notice={c.preview.note} />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <AdminCard key={card.key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{c.preview[card.key]}</h2>
                <p className="mt-1 text-xs text-muted" dir={card.description === "ar" ? "rtl" : "ltr"}>
                  {card.description === "ar" ? "معرض الأعمال" : "Portfolio"}
                </p>
              </div>
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                {card.badge}
              </span>
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-contrast transition-opacity hover:opacity-90"
              >
                {c.common.open}
              </Link>
            </div>
          </AdminCard>
        ))}
      </div>
    </>
  );
}
