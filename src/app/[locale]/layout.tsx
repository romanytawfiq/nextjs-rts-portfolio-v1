import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";

import { profile } from "@/lib/content";
import { defaultLocale, getDictionary, isLocale, locales } from "@/lib/i18n";
import { getSettings } from "@/lib/server/content";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Runs before hydration so the stored/system theme is applied before first paint.
const themeInit = `
(function () {
  try {
    var stored = localStorage.getItem("rts-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const t = await getDictionary(activeLocale);
  const settings = getSettings();
  // Fall back to the current locale's catalog, never to the other language's
  // admin-entered SEO copy.
  const siteTitle =
    (activeLocale === "ar" ? settings.seoTitleAr ?? t.metaTitle : settings.seoTitleEn ?? t.metaTitle);
  const siteDescription =
    activeLocale === "ar"
      ? settings.seoDescriptionAr ?? t.metaDescription
      : settings.seoDescriptionEn ?? t.metaDescription;

  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: siteTitle, template: `%s · ${profile.name}` },
    description: siteDescription,
    alternates: {
      canonical: `/${activeLocale}`,
      languages: { en: "/en", ar: "/ar", "x-default": "/ar" },
    },
    openGraph: {
      type: "website",
      locale: activeLocale === "ar" ? "ar_EG" : "en_US",
      url: `/${activeLocale}`,
      title: siteTitle,
      description: siteDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const t = await getDictionary(activeLocale);

  return (
    <html
      lang={activeLocale}
      dir={activeLocale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <NextIntlClientProvider>
          <a
            href="#main"
            className="sr-only rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100]"
          >
            {t.skipToContent}
          </a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
