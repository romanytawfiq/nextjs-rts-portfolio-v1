import { ContentEditor } from "@/components/admin/content-editor";
import {
  AdminCard,
  AdminPageHeader,
  Field,
  inputClass,
  StatusBadge,
} from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminContactPage({
  params,
}: PageProps<"/[locale]/admin/contact">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.contact;
  const content = getAdminContent();
  const contact = content.sections.contact as {
    phone: string;
    whatsapp: string;
    email: string;
    phoneVisible: boolean;
    whatsappVisible: boolean;
    emailVisible: boolean;
  };
  const visibleCount = [contact.phoneVisible, contact.whatsappVisible, contact.emailVisible].filter(
    Boolean,
  ).length;

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} />
      <AdminCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={c.form.phone}>
            <input className={inputClass} defaultValue={contact.phone} readOnly />
          </Field>
          <Field label={c.form.whatsapp}>
            <input className={inputClass} defaultValue={contact.whatsapp} readOnly />
          </Field>
          <Field label={c.form.email}>
            <input className={inputClass} defaultValue={contact.email} readOnly />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge tone="ok">
            {c.common.visible}: {visibleCount}
          </StatusBadge>
        </div>
      </AdminCard>
      <ContentEditor
        section="contact"
        values={contact}
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
