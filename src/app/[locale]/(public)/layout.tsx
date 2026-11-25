import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { defaultLocale, isLocale } from "@/lib/i18n";

export default async function PublicLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;

  return (
    <>
      <SiteHeader locale={activeLocale} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter locale={activeLocale} />
    </>
  );
}
