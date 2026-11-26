import { ContentEditor } from "@/components/admin/content-editor";
import { AdminCard, AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

type Project = {
  id?: number;
  slug: string;
  title: string;
  descriptionEn: string;
  descriptionAr: string | null;
  stack: string[];
  features: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  imageUrl: string | null;
  published: boolean;
  featured: boolean;
  sortOrder: number;
};

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminProjectsPage({
  params,
}: PageProps<"/[locale]/admin/projects">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.projects;
  const content = getAdminContent();
  const projects = content.sections.projects as Project[];
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
      <div className="grid gap-6">
        {projects.map((project) => (
          <AdminCard key={project.slug} title={project.title}>
            <p className="text-sm leading-6 text-muted">{project.descriptionEn}</p>
            <p className="mt-4 text-xs text-muted">
              {c.form.technologies}: {project.stack.join(" · ")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge tone={project.published ? "ok" : "muted"}>
                {project.published ? c.common.published : c.common.unpublished}
              </StatusBadge>
              {project.featured && <StatusBadge tone="ok">{c.common.featured}</StatusBadge>}
            </div>
          </AdminCard>
        ))}
      </div>
      <ContentEditor
        section="projects"
        values={projects}
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
            slug: "new-project",
            title: c.common.notProvided,
            descriptionEn: c.common.notProvided,
            descriptionAr: null,
            stack: [],
            features: [],
            repoUrl: null,
            demoUrl: null,
            imageUrl: null,
            published: false,
            featured: false,
            sortOrder: projects.length,
          },
        }}
      />
    </>
  );
}
