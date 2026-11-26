import { cacheLife } from "next/cache";

import { GitHubIcon, LinkedInIcon, MapPinIcon } from "@/components/icons";
import { Localized } from "@/components/localized";
import { ExternalLink } from "@/components/ui";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { getPublicContent } from "@/lib/server/content";

async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getDictionary(locale);
  const content = getPublicContent();
  const year = await getCopyrightYear();
  const arabic = locale === "ar";
  const whatsapp = content.contact.whatsapp;
  const socialLinks = content.socialLinks;

  return (
    <footer className="border-t border-line bg-surface-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              <Localized value={content.profile.name} arabic={arabic} />
            </p>
            <p className="mt-1 text-sm text-muted">{t.footer.role}</p>
            <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                <span className="sr-only">{t.hero.locationLabel}: </span>
                <Localized value={content.profile.location} arabic={arabic} />
              </span>
            </p>
            <p className="mt-4 max-w-xs text-xs leading-6 text-muted">{t.footer.note}</p>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground">
              {t.contact.phoneLabel}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {content.contact.phone && (
                <a
                  href={`tel:+20${content.contact.phone.replace(/^0/, "")}`}
                  dir="ltr"
                  className="inline-flex min-h-11 w-fit items-center text-sm font-medium text-foreground transition-colors hover:text-accent"
                >
                  {content.contact.phone}
                </a>
              )}
              {whatsapp && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {t.contact.whatsappLabel}
                  </p>
                  <a
                    href={`https://web.whatsapp.com/send?phone=${whatsapp.replace(/^0/, "20")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {whatsapp}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-foreground">
              {t.contact.socialLabel}
            </h2>
            <div className="mt-4 flex flex-col items-start gap-3">
              {socialLinks.map((link) => (
                <ExternalLink key={link.url} href={link.url} className="text-muted hover:text-accent">
                  {link.platform === "GitHub" ? (
                    <GitHubIcon className="size-4" />
                  ) : link.platform === "LinkedIn" ? (
                    <LinkedInIcon className="size-4" />
                  ) : null}
                  <Localized value={link.label} arabic={arabic} />
                </ExternalLink>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} <Localized value={content.profile.name} arabic={arabic} />. {t.footer.rights}
          </p>
          <p>{t.footer.source}</p>
        </div>
      </div>
    </footer>
  );
}
