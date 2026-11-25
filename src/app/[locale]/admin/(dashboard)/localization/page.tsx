import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
} from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

export default async function AdminLocalizationPage({
  params,
}: PageProps<"/[locale]/admin/localization">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.localization;
  const content = getAdminContent();
  const profile = content.sections.profile as { summaryAr: string | null };
  const certifications = content.sections.certifications as { title: string }[];

  // Project descriptions are intentionally English-only by owner decision
  // (2026-11-25), so they are not listed as missing Arabic translations.
  const rows = [
    { field: c.form.summary, arabic: profile.summaryAr },
    ...certifications.map((item) => ({
      field: `${c.localization.field} — ${item.title}`,
      arabic: null,
    })),
  ];

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} notice={c.common.editorNotice} />
      <AdminCard>
        <AdminTable headers={[c.localization.field, c.localization.locale, c.common.status]}>
          {rows.map((row) => (
            <tr key={row.field}>
              <td className="px-4 py-3 font-medium">{row.field}</td>
              <td className="px-4 py-3 text-muted">{c.common.arabic}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={row.arabic ? "ok" : "warn"}>
                  {row.arabic ? c.localization.ready : c.localization.missing}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
