import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";

import {routing} from "@/i18n/routing";

export const locales = routing.locales;
export type Locale = (typeof locales)[number];
export const defaultLocale = routing.defaultLocale;

export function isLocale(value: string): value is Locale {
  return hasLocale(locales, value);
}

type Widen<T> = T extends string
  ? string
  : T extends object
    ? {[K in keyof T]: Widen<T[K]>}
    : T;

type PublicMessages = typeof import("../../messages/en.json")["Public"];
export type Dictionary = Widen<PublicMessages>;

// Compatibility wrapper: all strings are resolved through next-intl so the
// library owns message lookup, interpolation and locale selection.
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const t = await getTranslations({locale, namespace: "Public"});
  return {
    "metaTitle": t("metaTitle"),
    "metaDescription": t("metaDescription"),
    "skipToContent": t("skipToContent"),
    "nav": {
      "about": t("nav.about"),
      "skills": t("nav.skills"),
      "projects": t("nav.projects"),
      "github": t("nav.github"),
      "certification": t("nav.certification"),
      "contact": t("nav.contact"),
    },
    "themeToggle": t("themeToggle"),
    "languageLabel": t("languageLabel"),
    "hero": {
      "kicker": t("hero.kicker"),
      "ctaPrimary": t("hero.ctaPrimary"),
      "ctaSecondary": t("hero.ctaSecondary"),
      "locationLabel": t("hero.locationLabel"),
      "cv": t("hero.cv"),
    },
    "about": {
      "title": t("about.title"),
      "kicker": t("about.kicker"),
      "languageLabel": t("about.languageLabel"),
    },
    "skills": {
      "title": t("skills.title"),
      "kicker": t("skills.kicker"),
      "groups": {
        "frontend": t("skills.groups.frontend"),
        "languages": t("skills.groups.languages"),
        "frameworks": t("skills.groups.frameworks"),
        "state": t("skills.groups.state"),
        "forms": t("skills.groups.forms"),
        "backend": t("skills.groups.backend"),
        "databases": t("skills.groups.databases"),
        "tools": t("skills.groups.tools"),
        "additional": t("skills.groups.additional"),
      },
    },
    "projects": {
      "title": t("projects.title"),
      "kicker": t("projects.kicker"),
      "stackLabel": t("projects.stackLabel"),
      "featuresLabel": t("projects.featuresLabel"),
      "noStack": t("projects.noStack"),
      "githubDescription": t("projects.githubDescription"),
      "githubSource": t("projects.githubSource"),
    },
    "github": {
      "title": t("github.title"),
      "kicker": t("github.kicker"),
      "profileCta": t("github.profileCta"),
    },
    "certification": {
      "title": t("certification.title"),
      "kicker": t("certification.kicker"),
      "issuerLabel": t("certification.issuerLabel"),
      "coverageLabel": t("certification.coverageLabel"),
    },
    "contact": {
      "title": t("contact.title"),
      "kicker": t("contact.kicker"),
      "phoneLabel": t("contact.phoneLabel"),
      "whatsappLabel": t("contact.whatsappLabel"),
      "socialLabel": t("contact.socialLabel"),
    },
    "footer": {
      "note": t("footer.note"),
      "role": t("footer.role"),
      "rights": t("footer.rights"),
    },
  };
}
