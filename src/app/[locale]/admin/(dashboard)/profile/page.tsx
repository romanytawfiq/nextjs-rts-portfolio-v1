import { ContentEditor } from "@/components/admin/content-editor";
import {
  AdminCard,
  AdminPageHeader,
  Field,
  inputClass,
} from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getCachedAdminContent } from "@/lib/server/content";

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminProfilePage({
  params,
}: PageProps<"/[locale]/admin/profile">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.profile;
  const content = await getCachedAdminContent();
  const profile = content.sections.profile as {
    name: string;
    title: string;
    location: string;
    summaryEn: string;
    summaryAr: string | null;
    imageUrl: string | null;
    resumeUrl: string | null;
  };

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} />
      <AdminCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={c.form.name}>
            <input className={inputClass} defaultValue={profile.name} readOnly />
          </Field>
          <Field label={c.form.jobTitle}>
            <input className={inputClass} defaultValue={profile.title} readOnly />
          </Field>
          <Field label={c.form.location}>
            <input className={inputClass} defaultValue={profile.location} readOnly />
          </Field>
          <Field label={c.form.summary}>
            <input className={inputClass} defaultValue={profile.summaryEn.slice(0, 80)} readOnly />
          </Field>
        </div>
      </AdminCard>
      <ContentEditor
        section="profile"
        values={profile}
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
