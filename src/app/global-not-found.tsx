import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import messagesAr from "../../messages/ar.json";
import messagesEn from "../../messages/en.json";

import "./globals.css";

export const metadata: Metadata = {
  title: `404 · ${messagesAr.NotFound.title} / ${messagesEn.NotFound.title}`,
  description: messagesAr.NotFound.description,
  robots: { index: false, follow: false },
};

// global-not-found bypasses the locale layout, so it owns its document and its
// theme bootstrap. The default locale is Arabic; the English block is tagged
// with its own lang/dir so both audiences get a complete 404 page.
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

const localeInit = `
(function () {
  try {
    var english = /^\\/en(?:\\/|$)/.test(window.location.pathname);
    document.documentElement.lang = english ? "en" : "ar";
    document.documentElement.dir = english ? "ltr" : "rtl";
  } catch (error) {}
})();
`;

function HomeLinks({ english, arabic }: { english: string; arabic: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/en"
        className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
      >
        {english}
      </Link>
      <Link
        href="/ar"
        className="rounded-full border border-line px-5 py-3 text-sm font-medium"
      >
        {arabic}
      </Link>
    </div>
  );
}

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl" className="h-full" suppressHydrationWarning>
      <head>
        <Script id="rts-global-theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
        <Script id="rts-global-locale-init" strategy="beforeInteractive">
          {localeInit}
        </Script>
      </head>
      <body className="flex min-h-full items-center justify-center bg-background px-5 py-20 text-foreground antialiased">
        <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2">
          <section lang="ar" dir="rtl">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">404</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              {messagesAr.NotFound.title}
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-muted">
              {messagesAr.NotFound.description}
            </p>
            <div className="mt-8">
              <HomeLinks
                english={messagesAr.NotFound.english}
                arabic={messagesAr.NotFound.arabic}
              />
            </div>
          </section>
          <section lang="en" dir="ltr" className="md:border-s md:border-line md:ps-10">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">404</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              {messagesEn.NotFound.title}
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-muted">
              {messagesEn.NotFound.description}
            </p>
            <div className="mt-8">
              <HomeLinks
                english={messagesEn.NotFound.english}
                arabic={messagesEn.NotFound.arabic}
              />
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
