import type { Metadata } from "next";

import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";

// Auth.js reads the session at request time. This segment and every admin page
// opt out of instant-navigation validation; authorization still runs on the server.
export const instant = false;

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const c = await getAdminCopy(activeLocale);

  return {
    title: {
      default: c.shell.admin,
      template: `%s · ${c.shell.admin}`,
    },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
