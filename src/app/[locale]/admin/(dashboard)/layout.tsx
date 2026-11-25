import { AdminNav } from "@/components/admin/nav";
import { AdminTopbar } from "@/components/admin/topbar";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";

export default async function DashboardLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const c = await getAdminCopy(activeLocale);
  const session = await requireAdminPage(activeLocale);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-surface lg:border-e lg:border-b-0">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold tracking-tight">{c.shell.admin}</p>
        </div>
        <AdminNav locale={activeLocale} />
      </aside>
      <div className="min-w-0">
        <AdminTopbar locale={activeLocale} login={session.login} />
        <main id="main" className="mx-auto max-w-5xl px-5 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
