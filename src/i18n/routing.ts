import {defineRouting} from "next-intl/routing";

// Owner-approved: Arabic is the default. Both prefixes are always explicit.
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "ar",
  localePrefix: "always",
  // Do not let Accept-Language or a stale cookie override the URL.
  localeDetection: false,
  localeCookie: false,
});
