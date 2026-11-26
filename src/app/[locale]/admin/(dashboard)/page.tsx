import Link from "next/link";

import { AdminCard, AdminPageHeader, StatCard, StatusBadge } from "@/components/admin/ui";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { requireAdminPage } from "@/lib/server/auth";
import { getAdminContent } from "@/lib/server/content";

// Auth.js reads the session at request time; this segment is allowed to block.
export const instant = false;

export default async function AdminOverviewPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.overview;
  const session = await requireAdminPage(activeLocale);
  const content = getAdminContent();
  const sections = content.sections as {
    skills: { skills: unknown[] }[];
    projects: unknown[];
    certifications: unknown[];
    socialLinks: unknown[];
  };
  const skillCount = sections.skills.reduce((total, group) => total + group.skills.length, 0);
  const quickLinks = [
    { segment: "/profile", label: c.nav.profile },
    { segment: "/projects", label: c.nav.projects },
    { segment: "/github", label: c.nav.github },
    { segment: "/preview", label: c.nav.preview },
  ];

  return (
    <>
      <AdminPageHeader
        title={page.title}
        subtitle={page.subtitle}
        notice={`${c.shell.viewer}: @${session?.login ?? "unknown"}`}
      />

      <h2 className="mb-4 text-sm font-semibold">{c.overview.summaryTitle}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={c.overview.projects} value={sections.projects.length} />
        <StatCard label={c.overview.skills} value={skillCount} />
        <StatCard label={c.overview.certifications} value={sections.certifications.length} />
        <StatCard label={c.overview.contacts} value={sections.socialLinks.length + 2} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminCard title={c.overview.syncTitle}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={content.sync.lastSyncAt ? "ok" : "warn"}>
              {content.sync.lastSyncAt ?? c.overview.syncNever}
            </StatusBadge>
            <span className="text-xs text-muted">
              {c.github.repoTable}: {content.sync.repoCount}
            </span>
          </div>
          {content.sync.lastError && (
            <p className="mt-4 text-xs text-accent">{content.sync.lastError}</p>
          )}
          <p className="mt-4 text-sm leading-6 text-muted">{c.github.connectNote}</p>
        </AdminCard>

        <AdminCard title={c.overview.quickTitle}>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.segment}
                href={`/${activeLocale}/admin${link.segment}`}
                className="rounded-lg border border-line px-3 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </AdminCard>
      </div>
    </>
  );
}
