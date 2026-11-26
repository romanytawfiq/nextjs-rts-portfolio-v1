import { ContentEditor } from "@/components/admin/content-editor";
import { AdminCard, AdminPageHeader, Field, inputClass } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getCachedAdminContent } from "@/lib/server/content";

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminSettingsPage({
  params,
}: PageProps<"/[locale]/admin/settings">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.settings;
  const content = await getCachedAdminContent();
  const settings = content.sections.settings as {
    defaultLocale: string;
    themeBehavior: string;
    seoTitleEn: string;
    seoTitleAr: string | null;
    seoDescriptionEn: string;
    seoDescriptionAr: string | null;
    sectionVisibility: Record<string, boolean>;
  };

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} />
      <AdminCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={c.form.defaultLocale}>
            <input className={inputClass} defaultValue={settings.defaultLocale} readOnly />
          </Field>
          <Field label={c.form.themeBehavior}>
            <input className={inputClass} defaultValue={settings.themeBehavior} readOnly />
          </Field>
          <Field label={c.form.seoTitle}>
            <input className={inputClass} defaultValue={settings.seoTitleEn} readOnly />
          </Field>
          <Field label={c.form.seoDescription}>
            <input className={inputClass} defaultValue={settings.seoDescriptionEn} readOnly />
          </Field>
        </div>
      </AdminCard>
      <ContentEditor
        section="settings"
        values={settings}
        labels={{
          save: c.common.savePreview,
          reset: c.common.cancel,
          hint: c.common.jsonEditor,
          saved: c.common.saved,
          invalidJson: c.common.invalidJson,
        }}
      />
    </>
  );
}
