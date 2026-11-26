import type { DatabaseSync } from "node:sqlite";

import { cacheLife, cacheTag } from "next/cache";

import messagesAr from "../../../messages/ar.json";
import messagesEn from "../../../messages/en.json";
import type { AdminIdentity } from "@/lib/server/auth-types";
import { getDb } from "@/lib/server/db";
import {
  certificationSchema,
  contactSchema,
  githubSettingsSchema,
  isSectionKey,
  profileSchema,
  projectSchema,
  repoPresentationSchema,
  sectionSchemas,
  settingsSchema,
  skillGroupSchema,
  socialLinkSchema,
  type SectionKey,
} from "@/lib/schemas/cms";

type Row = Record<string, unknown>;

function str(row: Row, key: string): string {
  return String(row[key] ?? "");
}

function nullableStr(row: Row, key: string): string | null {
  const value = row[key];
  return value === null || value === undefined ? null : String(value);
}

function bool(row: Row, key: string): boolean {
  return Number(row[key] ?? 0) === 1;
}

function num(row: Row, key: string): number {
  return Number(row[key] ?? 0);
}

function array<T>(row: Row, key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(str(row, key) || "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeRepoUrl(value: string | null): string {
  if (!value) return "";
  return value.trim().replace(/\.git$/i, "").replace(/\/+$/, "").toLowerCase();
}

function boolMap(row: Row, key: string): Record<string, boolean> {
  try {
    const parsed: unknown = JSON.parse(str(row, key) || "{}");
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      return first && typeof first === "object"
        ? (first as Record<string, boolean>)
        : {};
    }
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

export type PublicContent = {
  profile: {
    name: string;
    title: string;
    location: string;
    summaryEn: string;
    summaryAr: string | null;
    imageUrl: string | null;
    resumeUrl: string | null;
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  };
  socialLinks: { platform: string; url: string; label: string }[];
  skillGroups: {
    id: string;
    labelEn: string;
    labelAr: string | null;
    skills: string[];
  }[];
  projects: {
    slug: string;
    title: string;
    descriptionEn: string;
    descriptionAr: string | null;
    stack: string[];
    features: string[];
    repoUrl: string | null;
    demoUrl: string | null;
    imageUrl: string | null;
    featured: boolean;
    sortOrder: number;
    source: "curated" | "github";
    githubId?: number;
  }[];
  certifications: {
    title: string;
    issuer: string;
    issueDate: string | null;
    credentialUrl: string | null;
    documentUrl: string | null;
    coverage: string[];
  }[];
  settings: {
    defaultLocale: "en" | "ar";
    themeBehavior: "light" | "dark" | "system";
    sectionVisibility: Record<string, boolean>;
  };
  github: {
    login: string;
    lastSyncAt: string | null;
    lastError: string | null;
    includeForks: boolean;
    includeArchived: boolean;
    cacheMinutes: number;
    repos: {
      name: string;
      fullName: string;
      description: string | null;
      htmlUrl: string;
      language: string | null;
      topics: string[];
      stars: number;
      isFork: boolean;
      isArchived: boolean;
      pushedAt: string | null;
      featured: boolean;
    }[];
  };
};

function readSettings(db: DatabaseSync) {
  const row = db.prepare("SELECT * FROM site_settings WHERE id = 1").get() ?? {};
  return {
    defaultLocale: (str(row, "default_locale") === "ar" ? "ar" : "en") as "en" | "ar",
    themeBehavior: (["light", "dark", "system"].includes(str(row, "theme_behavior"))
      ? str(row, "theme_behavior")
      : "system") as "light" | "dark" | "system",
    seoTitleEn: str(row, "seo_title_en"),
    seoTitleAr: nullableStr(row, "seo_title_ar"),
    seoDescriptionEn: str(row, "seo_description_en"),
    seoDescriptionAr: nullableStr(row, "seo_description_ar"),
    sectionVisibility: boolMap(row, "section_visibility"),
    updatedAt: str(row, "updated_at"),
  };
}

export function getSettings() {
  return readSettings(getDb());
}

export function getPublicContent(): PublicContent {
  const db = getDb();
  const profileRow = db.prepare("SELECT * FROM profile WHERE id = 1").get() ?? {};
  const contactRows = db
    .prepare("SELECT * FROM contact_methods WHERE visible = 1 ORDER BY sort_order")
    .all();
  const socialRows = db
    .prepare("SELECT * FROM social_links WHERE visible = 1 ORDER BY sort_order")
    .all();
  const groupRows = db
    .prepare("SELECT * FROM skill_groups WHERE visible = 1 ORDER BY sort_order")
    .all();
  const skillRows = db
    .prepare("SELECT * FROM skills WHERE visible = 1 ORDER BY sort_order")
    .all();
  const projectRows = db
    .prepare("SELECT * FROM projects WHERE published = 1 ORDER BY sort_order")
    .all();
  const certRows = db
    .prepare("SELECT * FROM certifications WHERE published = 1 ORDER BY sort_order")
    .all();
  const syncRow = db.prepare("SELECT * FROM github_sync_state WHERE id = 1").get() ?? {};
  const repoRows = db
    .prepare(
      `SELECT * FROM github_repos WHERE hidden = 0
       ORDER BY featured DESC, sort_order ASC, name ASC`,
    )
    .all();
  const settings = readSettings(db);

  const contactValue = (kind: string) =>
    contactRows.find((row) => str(row, "kind") === kind);

  return {
    profile: {
      name: str(profileRow, "name"),
      title: str(profileRow, "title"),
      location: str(profileRow, "location"),
      summaryEn: str(profileRow, "summary_en"),
      summaryAr: nullableStr(profileRow, "summary_ar"),
      imageUrl: nullableStr(profileRow, "image_url"),
      resumeUrl: nullableStr(profileRow, "resume_url"),
    },
    contact: {
      phone: contactValue("phone") ? str(contactValue("phone")!, "value") : null,
      whatsapp: contactValue("whatsapp")
        ? str(contactValue("whatsapp")!, "value")
        : null,
      email: contactValue("email") ? str(contactValue("email")!, "value") : null,
    },
    socialLinks: socialRows.map((row) => ({
      platform: str(row, "platform"),
      url: str(row, "url"),
      label: str(row, "label"),
    })),
    skillGroups: groupRows.map((row) => ({
      id: str(row, "key"),
      labelEn: str(row, "label_en"),
      labelAr: nullableStr(row, "label_ar"),
      skills: skillRows
        .filter((skill) => num(skill, "group_id") === num(row, "id"))
        .map((skill) => str(skill, "name")),
    })),
    projects: (() => {
      const curated = projectRows.map((row) => ({
        slug: str(row, "slug"),
        title: str(row, "title"),
        descriptionEn: str(row, "description_en"),
        descriptionAr: nullableStr(row, "description_ar"),
        stack: array<string>(row, "stack"),
        features: array<string>(row, "features"),
        repoUrl: nullableStr(row, "repo_url"),
        demoUrl: nullableStr(row, "demo_url"),
        imageUrl: nullableStr(row, "image_url"),
        featured: bool(row, "featured"),
        sortOrder: num(row, "sort_order"),
        source: "curated" as const,
      }));

      // Synced repositories are shown as projects without overwriting the
      // owner-curated rows. Hidden repos stay out; featured repos lead.
      const curatedRepoUrls = new Set(
        curated.map((project) => normalizeRepoUrl(project.repoUrl)).filter(Boolean),
      );
      const enGithubCopy = messagesEn.Public.projects.githubDescription;
      const arGithubCopy = messagesAr.Public.projects.githubDescription;
      const synced = repoRows
        .filter((row) => !curatedRepoUrls.has(normalizeRepoUrl(nullableStr(row, "html_url"))))
        .map((row) => {
          const language = nullableStr(row, "primary_language");
          const topics = array<string>(row, "topics").slice(0, 8);
          return {
            slug: `github-${num(row, "github_id")}`,
            title: str(row, "name"),
            descriptionEn: nullableStr(row, "description") || enGithubCopy,
            descriptionAr: nullableStr(row, "description") || arGithubCopy,
            stack: [language, ...topics]
              .filter((item): item is string => Boolean(item))
              .slice(0, 8),
            features: [],
            repoUrl: str(row, "html_url") || null,
            demoUrl: null,
            imageUrl: null,
            featured: bool(row, "featured"),
            sortOrder: num(row, "sort_order"),
            source: "github" as const,
            githubId: num(row, "github_id"),
          };
        });

      // Featured items lead across both sources; curated rows keep priority
      // when the other keys tie so owner-written content is never buried.
      return [...curated, ...synced].sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.source !== b.source) return a.source === "curated" ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.title.localeCompare(b.title);
      });
    })(),
    certifications: certRows.map((row) => ({
      title: str(row, "title"),
      issuer: str(row, "issuer"),
      issueDate: nullableStr(row, "issue_date"),
      credentialUrl: nullableStr(row, "credential_url"),
      documentUrl: nullableStr(row, "document_url"),
      coverage: array<string>(row, "coverage"),
    })),
    settings: {
      defaultLocale: settings.defaultLocale,
      themeBehavior: settings.themeBehavior,
      sectionVisibility: {
        about: true,
        skills: true,
        projects: true,
        github: true,
        certification: true,
        contact: true,
        ...settings.sectionVisibility,
      },
    },
    github: {
      login: str(syncRow, "login"),
      lastSyncAt: nullableStr(syncRow, "last_sync_at"),
      lastError: nullableStr(syncRow, "last_error"),
      includeForks: bool(syncRow, "include_forks"),
      includeArchived: bool(syncRow, "include_archived"),
      cacheMinutes: num(syncRow, "cache_minutes") || 60,
      repos: repoRows.map((row) => ({
        name: str(row, "name"),
        fullName: str(row, "full_name"),
        description: nullableStr(row, "description"),
        htmlUrl: str(row, "html_url"),
        language: nullableStr(row, "primary_language"),
        topics: array<string>(row, "topics"),
        stars: num(row, "stargazers_count"),
        isFork: bool(row, "is_fork"),
        isArchived: bool(row, "is_archived"),
        pushedAt: nullableStr(row, "pushed_at"),
        featured: bool(row, "featured"),
      })),
    },
  };
}

export type AdminContent = {
  sections: Record<string, unknown>;
  sync: {
    login: string;
    lastSyncAt: string | null;
    lastError: string | null;
    includeForks: boolean;
    includeArchived: boolean;
    cacheMinutes: number;
    repoCount: number;
  };
};

export function getAdminContent(): AdminContent {
  const db = getDb();
  const syncRow = db.prepare("SELECT * FROM github_sync_state WHERE id = 1").get() ?? {};
  const profileRow = db.prepare("SELECT * FROM profile WHERE id = 1").get() ?? {};
  const contactRows = db.prepare("SELECT * FROM contact_methods ORDER BY sort_order").all();
  const sections = {
    profile: {
      name: str(profileRow, "name"),
      title: str(profileRow, "title"),
      location: str(profileRow, "location"),
      summaryEn: str(profileRow, "summary_en"),
      summaryAr: nullableStr(profileRow, "summary_ar"),
      imageUrl: nullableStr(profileRow, "image_url"),
      resumeUrl: nullableStr(profileRow, "resume_url"),
    },
    contact: {
      phone: str(contactRows.find((row) => str(row, "kind") === "phone") ?? {}, "value"),
      whatsapp: str(contactRows.find((row) => str(row, "kind") === "whatsapp") ?? {}, "value"),
      email: str(contactRows.find((row) => str(row, "kind") === "email") ?? {}, "value"),
      phoneVisible: bool(contactRows.find((row) => str(row, "kind") === "phone") ?? {}, "visible"),
      whatsappVisible: bool(
        contactRows.find((row) => str(row, "kind") === "whatsapp") ?? {},
        "visible",
      ),
      emailVisible: bool(contactRows.find((row) => str(row, "kind") === "email") ?? {}, "visible"),
    },
    socialLinks: db
      .prepare("SELECT * FROM social_links ORDER BY sort_order")
      .all()
      .map((row) => ({
        id: num(row, "id"),
        platform: str(row, "platform"),
        url: str(row, "url"),
        label: str(row, "label"),
        visible: bool(row, "visible"),
        sortOrder: num(row, "sort_order"),
      })),
    skills: db
      .prepare("SELECT * FROM skill_groups ORDER BY sort_order")
      .all()
      .map((row) => ({
        id: num(row, "id"),
        key: str(row, "key"),
        labelEn: str(row, "label_en"),
        labelAr: nullableStr(row, "label_ar"),
        visible: bool(row, "visible"),
        sortOrder: num(row, "sort_order"),
        skills: db
          .prepare("SELECT * FROM skills WHERE group_id = ? ORDER BY sort_order")
          .all(num(row, "id"))
          .map((skill) => ({
            id: num(skill, "id"),
            name: str(skill, "name"),
            visible: bool(skill, "visible"),
            sortOrder: num(skill, "sort_order"),
          })),
      })),
    projects: db
      .prepare("SELECT * FROM projects ORDER BY sort_order")
      .all()
      .map((row) => ({
        id: num(row, "id"),
        slug: str(row, "slug"),
        title: str(row, "title"),
        descriptionEn: str(row, "description_en"),
        descriptionAr: nullableStr(row, "description_ar"),
        stack: array<string>(row, "stack"),
        features: array<string>(row, "features"),
        repoUrl: nullableStr(row, "repo_url"),
        demoUrl: nullableStr(row, "demo_url"),
        imageUrl: nullableStr(row, "image_url"),
        published: bool(row, "published"),
        featured: bool(row, "featured"),
        sortOrder: num(row, "sort_order"),
      })),
    certifications: db
      .prepare("SELECT * FROM certifications ORDER BY sort_order")
      .all()
      .map((row) => ({
        id: num(row, "id"),
        title: str(row, "title"),
        issuer: str(row, "issuer"),
        issueDate: nullableStr(row, "issue_date"),
        credentialUrl: nullableStr(row, "credential_url"),
        documentUrl: nullableStr(row, "document_url"),
        coverage: array<string>(row, "coverage"),
        published: bool(row, "published"),
        sortOrder: num(row, "sort_order"),
      })),
    settings: readSettings(db),
    githubSettings: {
      includeForks: bool(syncRow, "include_forks"),
      includeArchived: bool(syncRow, "include_archived"),
      cacheMinutes: num(syncRow, "cache_minutes") || 60,
    },
    repoPresentation: db
      .prepare("SELECT * FROM github_repos ORDER BY sort_order, name")
      .all()
      .map((row) => ({
        githubId: num(row, "github_id"),
        featured: bool(row, "featured"),
        hidden: bool(row, "hidden"),
        sortOrder: num(row, "sort_order"),
      })),
  };

  return {
    sections,
    sync: {
      login: str(syncRow, "login"),
    lastSyncAt: nullableStr(syncRow, "last_sync_at"),
    lastError: nullableStr(syncRow, "last_error"),
    includeForks: bool(syncRow, "include_forks"),
    includeArchived: bool(syncRow, "include_archived"),
    cacheMinutes: num(syncRow, "cache_minutes") || 60,
      repoCount: num(
        db.prepare("SELECT COUNT(*) AS total FROM github_repos").get() ?? {},
        "total",
      ),
    },
  };
}

export const CMS_CACHE_TAG = "cms-content";

// Admin pages share one CMS read. A short server cache removes repeated SQLite
// work on sibling navigations; stale: 0 keeps it out of prerendered shells and
// forces a fresh read on the next request after a mutation invalidates the tag.
export async function getCachedAdminContent(): Promise<AdminContent> {
  "use cache";
  cacheTag(CMS_CACHE_TAG);
  cacheLife({ stale: 0, revalidate: 30, expire: 120 });
  return getAdminContent();
}

export function audit(db: DatabaseSync, githubId: number | null, action: string, detail: string) {
  db.prepare(
    "INSERT INTO audit_events (github_id, action, detail, created_at) VALUES (?, ?, ?, ?)",
  ).run(githubId, action, detail.slice(0, 500), new Date().toISOString());
}

type SectionValue = string | number | boolean | null;

function insertRow(
  db: DatabaseSync,
  table: string,
  columns: string[],
  values: SectionValue[],
) {
  const placeholders = columns.map(() => "?").join(", ");
  db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`).run(
    ...values,
  );
}

function replaceSimpleRows(
  db: DatabaseSync,
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
  map: (row: Record<string, unknown>) => SectionValue[],
) {
  db.prepare(`DELETE FROM ${table}`).run();
  rows.forEach((row) => insertRow(db, table, columns, map(row)));
}

// Reuse IDs only from rows read back from SQLite. Client-supplied IDs are never
// accepted, but stable natural keys keep editor references intact across saves.
function previousIdMap(
  rows: Row[],
  key: (row: Row) => string,
): Map<string, number> {
  return new Map(rows.map((row) => [key(row), num(row, "id")]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function itemLabel(value: unknown, index: number): string {
  if (!isRecord(value)) return `[${index}]`;
  for (const key of ["slug", "key", "platform", "title", "name"] as const) {
    const label = value[key];
    if (typeof label === "string" && label) return `${key}=${label}`;
  }
  return `[${index}]`;
}

function changedKeys(before: unknown, after: unknown, path = ""): string[] {
  if (Array.isArray(before) && Array.isArray(after)) {
    const keys: string[] = [];
    if (before.length !== after.length) keys.push(`${path || "items"}.length`);
    for (let index = 0; index < Math.min(before.length, after.length); index += 1) {
      const segment = `${path || "items"}[${itemLabel(after[index], index)}]`;
      keys.push(...changedKeys(before[index], after[index], segment));
    }
    return keys;
  }

  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap((key) =>
      changedKeys(before[key], after[key], path ? `${path}.${key}` : key),
    );
  }

  if (JSON.stringify(before) !== JSON.stringify(after)) return [path || "value"];
  return [];
}

function auditDetail(
  before: unknown,
  after: unknown,
  actor?: Pick<AdminIdentity, "sub" | "login" | "method">,
): { githubId: number | null; detail: string } {
  const changes = changedKeys(before, after);
  const summary = changes.length
    ? `changed=${changes.slice(0, 20).join(",")}`
    : "changed=none";
  if (!actor) return { githubId: null, detail: summary };

  const identity =
    actor.method === "github"
      ? `github:${actor.login}#${actor.sub}`
      : `password:${actor.login}`;
  return {
    githubId: actor.method === "github" ? actor.sub : null,
    detail: `actor=${identity}; ${summary}`,
  };
}

export function updateSection(
  section: SectionKey,
  rawValues: unknown,
  actor?: Pick<AdminIdentity, "sub" | "login" | "method">,
) {
  if (!isSectionKey(section)) {
    throw new Error(`Unknown section: ${section}`);
  }
  const values = sectionSchemas[section].parse(rawValues);
  const db = getDb();
  const before = getAdminContent().sections[section];
  const now = new Date().toISOString();

  db.exec("BEGIN");
  try {
    switch (section) {
      case "profile": {
        const v = profileSchema.parse(values);
        db.prepare(
          `UPDATE profile SET name = ?, title = ?, location = ?, summary_en = ?,
           summary_ar = ?, image_url = ?, resume_url = ?, updated_at = ? WHERE id = 1`,
        ).run(
          v.name,
          v.title,
          v.location,
          v.summaryEn,
          v.summaryAr || null,
          v.imageUrl || null,
          v.resumeUrl || null,
          now,
        );
        break;
      }
      case "contact": {
        const v = contactSchema.parse(values);
        const entries: [string, string, boolean, number][] = [
          ["phone", v.phone, v.phoneVisible, 1],
          ["whatsapp", v.whatsapp, v.whatsappVisible, 2],
          ["email", v.email || "", v.emailVisible, 3],
        ];
        for (const [kind, value, visible, order] of entries) {
          db.prepare(
            `INSERT INTO contact_methods (kind, value, visible, sort_order)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(kind) DO UPDATE SET value = excluded.value,
               visible = excluded.visible, sort_order = excluded.sort_order`,
          ).run(kind, value, visible ? 1 : 0, order);
        }
        break;
      }
      case "socialLinks": {
        const v = socialLinkSchema.array().parse(values);
        const previous = previousIdMap(
          db.prepare("SELECT id, platform, url, label FROM social_links").all() as Row[],
          (row) => JSON.stringify([str(row, "platform"), str(row, "url"), str(row, "label")]),
        );
        replaceSimpleRows(
          db,
          "social_links",
          ["id", "platform", "url", "label", "visible", "sort_order"],
          v as unknown as Record<string, unknown>[],
          (row) => [
            previous.get(
              JSON.stringify([row.platform, row.url, row.label]),
            ) ?? null,
            row.platform as string,
            row.url as string,
            row.label as string,
            row.visible ? 1 : 0,
            row.sortOrder as number,
          ],
        );
        break;
      }
      case "skills": {
        const v = skillGroupSchema.array().parse(values);
        const previousGroups = previousIdMap(
          db.prepare("SELECT id, key FROM skill_groups").all() as Row[],
          (row) => str(row, "key"),
        );
        const previousSkills = previousIdMap(
          db
            .prepare(
              `SELECT skills.id, skill_groups.key AS group_key, skills.name, skills.sort_order
               FROM skills JOIN skill_groups ON skill_groups.id = skills.group_id`,
            )
            .all() as Row[],
          (row) =>
            JSON.stringify([str(row, "group_key"), str(row, "name"), num(row, "sort_order")]),
        );
        db.prepare("DELETE FROM skills").run();
        db.prepare("DELETE FROM skill_groups").run();
        for (const group of v) {
          const result = db
            .prepare(
              `INSERT INTO skill_groups (id, key, label_en, label_ar, visible, sort_order)
               VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(
              previousGroups.get(group.key) ?? null,
              group.key,
              group.labelEn,
              group.labelAr || null,
              group.visible ? 1 : 0,
              group.sortOrder,
            );
          const groupId = Number(result.lastInsertRowid);
          for (const skill of group.skills) {
            db.prepare(
              `INSERT INTO skills (id, group_id, name, visible, sort_order)
               VALUES (?, ?, ?, ?, ?)`,
            ).run(
              previousSkills.get(
                JSON.stringify([group.key, skill.name, skill.sortOrder]),
              ) ?? null,
              groupId,
              skill.name,
              skill.visible ? 1 : 0,
              skill.sortOrder,
            );
          }
        }
        break;
      }
      case "projects": {
        const v = projectSchema.array().parse(values);
        const previous = previousIdMap(
          db.prepare("SELECT id, slug FROM projects").all() as Row[],
          (row) => str(row, "slug"),
        );
        replaceSimpleRows(
          db,
          "projects",
          [
            "id",
            "slug",
            "title",
            "description_en",
            "description_ar",
            "stack",
            "features",
            "repo_url",
            "demo_url",
            "image_url",
            "published",
            "featured",
            "sort_order",
            "created_at",
            "updated_at",
          ],
          v as unknown as Record<string, unknown>[],
          (row) => [
            previous.get(str(row, "slug")) ?? null,
            row.slug as string,
            row.title as string,
            row.descriptionEn as string,
            (row.descriptionAr as string | null) || null,
            JSON.stringify(row.stack),
            JSON.stringify(row.features),
            (row.repoUrl as string | null) || null,
            (row.demoUrl as string | null) || null,
            (row.imageUrl as string | null) || null,
            row.published ? 1 : 0,
            row.featured ? 1 : 0,
            row.sortOrder as number,
            now,
            now,
          ],
        );
        break;
      }
      case "certifications": {
        const v = certificationSchema.array().parse(values);
        const previous = previousIdMap(
          db.prepare("SELECT id, title, issuer FROM certifications").all() as Row[],
          (row) => JSON.stringify([str(row, "title"), str(row, "issuer")]),
        );
        replaceSimpleRows(
          db,
          "certifications",
          [
            "id",
            "title",
            "issuer",
            "issue_date",
            "credential_url",
            "document_url",
            "coverage",
            "published",
            "sort_order",
            "created_at",
            "updated_at",
          ],
          v as unknown as Record<string, unknown>[],
          (row) => [
            previous.get(JSON.stringify([row.title, row.issuer])) ?? null,
            row.title as string,
            row.issuer as string,
            (row.issueDate as string | null) || null,
            (row.credentialUrl as string | null) || null,
            (row.documentUrl as string | null) || null,
            JSON.stringify(row.coverage),
            row.published ? 1 : 0,
            row.sortOrder as number,
            now,
            now,
          ],
        );
        break;
      }
      case "settings": {
        const v = settingsSchema.parse(values);
        db.prepare(
          `UPDATE site_settings SET default_locale = ?, theme_behavior = ?,
           seo_title_en = ?, seo_title_ar = ?, seo_description_en = ?,
           seo_description_ar = ?, section_visibility = ?, updated_at = ? WHERE id = 1`,
        ).run(
          v.defaultLocale,
          v.themeBehavior,
          v.seoTitleEn,
          v.seoTitleAr || null,
          v.seoDescriptionEn,
          v.seoDescriptionAr || null,
          JSON.stringify(v.sectionVisibility),
          now,
        );
        break;
      }
      case "githubSettings": {
        const v = githubSettingsSchema.parse(values);
        db.prepare(
          `UPDATE github_sync_state SET include_forks = ?, include_archived = ?,
           cache_minutes = ? WHERE id = 1`,
        ).run(v.includeForks ? 1 : 0, v.includeArchived ? 1 : 0, v.cacheMinutes);
        break;
      }
      case "repoPresentation": {
        const v = repoPresentationSchema.array().parse(values);
        for (const repo of v) {
          db.prepare(
            `UPDATE github_repos SET featured = ?, hidden = ?, sort_order = ?
             WHERE github_id = ?`,
          ).run(repo.featured ? 1 : 0, repo.hidden ? 1 : 0, repo.sortOrder, repo.githubId);
        }
        break;
      }
    }
    const log = auditDetail(before, values, actor);
    audit(db, log.githubId, `content.${section}`, log.detail);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
