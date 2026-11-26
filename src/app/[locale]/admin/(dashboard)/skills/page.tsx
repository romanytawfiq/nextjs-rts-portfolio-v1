import { ContentEditor } from "@/components/admin/content-editor";
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { getDictionary, defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getCachedAdminContent } from "@/lib/server/content";

type SkillGroup = {
  id?: number;
  key: string;
  labelEn: string;
  labelAr: string | null;
  visible: boolean;
  sortOrder: number;
  skills: { id?: number; name: string; visible: boolean; sortOrder: number }[];
};

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminSkillsPage({
  params,
}: PageProps<"/[locale]/admin/skills">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.skills;
  const publicCopy = await getDictionary(activeLocale);
  const content = await getCachedAdminContent();
  const groups = content.sections.skills as SkillGroup[];
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
      <AdminPageHeader title={page.title} subtitle={page.subtitle} />
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <AdminCard key={group.key} title={publicCopy.skills.groups[group.key as keyof typeof publicCopy.skills.groups] ?? group.labelEn}>
            <ul className="grid gap-1.5 text-sm text-muted">
              {group.skills.map((skill) => (
                <li key={skill.name}>{skill.name}</li>
              ))}
            </ul>
            <div className="mt-4">
              <StatusBadge tone={group.visible ? "ok" : "muted"}>
                {group.visible ? c.common.visible : c.common.hidden}
              </StatusBadge>
            </div>
          </AdminCard>
        ))}
      </div>
      <ContentEditor
        section="skills"
        values={groups}
        labels={{
          save: c.common.savePreview,
          reset: c.common.cancel,
          hint: c.common.jsonEditor,
          saved: c.common.saved,
          invalidJson: c.common.invalidJson,
          ...quickLabels,
        }}
        list={{
          titleKey: "labelEn",
          visibilityKey: "visible",
          template: {
            key: "new-group",
            labelEn: c.common.notProvided,
            labelAr: null,
            visible: false,
            sortOrder: groups.length,
            skills: [],
          },
          nested: {
            key: "skills",
            titleKey: "name",
            visibilityKey: "visible",
            template: {
              name: c.common.notProvided,
              visible: false,
              sortOrder: 0,
            },
          },
        }}
      />
    </>
  );
}
