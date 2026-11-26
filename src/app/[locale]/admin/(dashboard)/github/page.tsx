import { ContentEditor } from "@/components/admin/content-editor";
import { SyncButton } from "@/components/admin/sync-button";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { GitHubIcon } from "@/components/icons";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

type RepoPresentation = { githubId: number; featured: boolean; hidden: boolean; sortOrder: number };

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminGitHubPage({
  params,
}: PageProps<"/[locale]/admin/github">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  await requireAdminPage(activeLocale);
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.github;
  const content = getAdminContent();
  const settings = content.sections.githubSettings as {
    includeForks: boolean;
    includeArchived: boolean;
    cacheMinutes: number;
  };
  const repos = content.sections.repoPresentation as RepoPresentation[];

  return (
    <>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} notice={c.common.editorNotice} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title={c.github.connectTitle}>
          <div className="flex items-center gap-3">
            <GitHubIcon className="size-8 text-accent" />
            <div>
              <p className="text-sm font-medium" dir="ltr">
                https://github.com/{content.sync.login}
              </p>
              <p className="text-xs text-muted">{c.github.connectNote}</p>
            </div>
          </div>
          <SyncButton
            label={c.github.syncButton}
            busyLabel="…"
            repositoriesLabel={c.github.repoTable}
            failedLabel={c.github.syncFailed}
          />
        </AdminCard>

        <AdminCard title={c.overview.syncTitle}>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={content.sync.lastSyncAt ? "ok" : "warn"}>
              {content.sync.lastSyncAt ?? c.overview.syncNever}
            </StatusBadge>
            <span className="text-xs text-muted">
              {c.github.repoTable}: {content.sync.repoCount}
            </span>
          </div>
          {content.sync.lastError && (
            <p className="mt-4 break-words text-xs text-accent" dir="ltr">
              {content.sync.lastError}
            </p>
          )}
        </AdminCard>
      </div>

      <AdminCard title={c.github.repoTable} className="mt-6">
        {repos.length === 0 ? (
          <EmptyState>{c.github.emptyRepos}</EmptyState>
        ) : (
          <AdminTable headers={["ID", c.github.featured, c.common.hidden, c.common.order]}>
            {repos.map((repo) => (
              <tr key={repo.githubId}>
                <td className="px-4 py-3" dir="ltr">{repo.githubId}</td>
                <td className="px-4 py-3">{repo.featured ? c.common.enabled : c.common.none}</td>
                <td className="px-4 py-3">{repo.hidden ? c.common.hidden : c.common.visible}</td>
                <td className="px-4 py-3">{repo.sortOrder}</td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>

      <ContentEditor
        section="githubSettings"
        values={settings}
        labels={{
          save: c.common.savePreview,
          reset: c.common.cancel,
          hint: c.common.jsonEditor,
          saved: c.common.saved,
          invalidJson: c.common.invalidJson,
        }}
      />
      {repos.length > 0 && (
        <ContentEditor
          section="repoPresentation"
          values={repos}
          labels={{
            save: c.common.savePreview,
            reset: c.common.cancel,
            hint: c.common.jsonEditor,
            saved: c.common.saved,
            invalidJson: c.common.invalidJson,
          }}
        />
      )}
    </>
  );
}
