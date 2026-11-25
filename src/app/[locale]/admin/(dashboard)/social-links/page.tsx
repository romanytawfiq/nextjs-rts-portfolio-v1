import { ContentEditor } from "@/components/admin/content-editor";
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

type SocialLink = {
  id?: number;
  platform: string;
  url: string;
  label: string;
  visible: boolean;
  sortOrder: number;
};

export default async function AdminSocialLinksPage({
  params,
}: PageProps<"/[locale]/admin/social-links">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.social;
  const content = getAdminContent();
  const links = content.sections.socialLinks as SocialLink[];
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
      <AdminCard>
        <AdminTable
          headers={[c.form.platform, c.form.url, c.form.visibility, c.common.order]}
        >
          {links.map((link) => (
            <tr key={link.url}>
              <td className="px-4 py-3 font-medium">{link.platform}</td>
              <td className="px-4 py-3 text-muted" dir="ltr">
                {link.url}
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={link.visible ? "ok" : "muted"}>
                  {link.visible ? c.common.visible : c.common.hidden}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-muted">{link.sortOrder}</td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
      <ContentEditor
        section="socialLinks"
        values={links}
        labels={{
          save: c.common.savePreview,
          reset: c.common.cancel,
          hint: c.common.jsonEditor,
          saved: c.common.saved,
          invalidJson: c.common.invalidJson,
          ...quickLabels,
        }}
        list={{
          titleKey: "label",
          visibilityKey: "visible",
          template: {
            platform: c.common.notProvided,
            url: "https://example.com",
            label: c.common.notProvided,
            visible: false,
            sortOrder: links.length,
          },
        }}
      />
    </>
  );
}
