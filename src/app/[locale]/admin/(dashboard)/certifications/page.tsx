import { ContentEditor } from "@/components/admin/content-editor";
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

type Certification = {
  id?: number;
  title: string;
  issuer: string;
  issueDate: string | null;
  credentialUrl: string | null;
  documentUrl: string | null;
  coverage: string[];
  published: boolean;
  sortOrder: number;
};

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminCertificationsPage({
  params,
}: PageProps<"/[locale]/admin/certifications">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.certifications;
  const content = getAdminContent();
  const certifications = content.sections.certifications as Certification[];
  const quickLabels = {
    add: c.common.add,
    remove: c.common.remove,
    up: c.common.up,
    down: c.common.down,
    visible: c.common.visible,
    hidden: c.common.hidden,
    published: c.common.published,
    unpublished: c.common.unpublished,
    notProvided: c.common.notProvided,
    actions: c.common.actions,
  };

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} notice={c.common.editorNotice} />
      {certifications.map((certification) => (
        <AdminCard key={certification.title} title={certification.title}>
          <p className="text-sm text-muted">
            {c.form.issuer}: {certification.issuer}
          </p>
          <p className="mt-3 text-xs text-muted">
            {c.common.field}: {certification.coverage.join(" · ")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge tone={certification.published ? "ok" : "muted"}>
              {certification.published ? c.common.published : c.common.unpublished}
            </StatusBadge>
          </div>
        </AdminCard>
      ))}
      <ContentEditor
        section="certifications"
        values={certifications}
        labels={{
          save: c.common.savePreview,
          reset: c.common.cancel,
          hint: c.common.jsonEditor,
          saved: c.common.saved,
          invalidJson: c.common.invalidJson,
          ...quickLabels,
        }}
        list={{
          titleKey: "title",
          visibilityKey: "published",
          template: {
            title: c.common.notProvided,
            issuer: c.common.notProvided,
            issueDate: null,
            credentialUrl: null,
            documentUrl: null,
            coverage: [],
            published: false,
            sortOrder: certifications.length,
          },
        }}
      />
    </>
  );
}
