import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  certifications,
  contact,
  profile,
  projects,
  skillGroups,
} from "@/lib/content";
import messagesAr from "../../../messages/ar.json";
import messagesEn from "../../../messages/en.json";

// Deterministic seed timestamp: local DB seeding must not produce a fresh
// Date.now()/new Date() value while a page is being prerendered.
const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

// Local-development SQLite only. Production storage topology is still an owner
// decision; no ORM is selected or embedded here.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_allowlist (
  github_id INTEGER PRIMARY KEY,
  login TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_credentials (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  auth_version TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  default_locale TEXT NOT NULL DEFAULT 'en',
  theme_behavior TEXT NOT NULL DEFAULT 'system',
  seo_title_en TEXT NOT NULL,
  seo_title_ar TEXT,
  seo_description_en TEXT NOT NULL,
  seo_description_ar TEXT,
  section_visibility TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  summary_en TEXT NOT NULL,
  summary_ar TEXT,
  image_url TEXT,
  resume_url TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL UNIQUE CHECK (kind IN ('phone', 'whatsapp', 'email')),
  value TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skill_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  label_en TEXT NOT NULL,
  label_ar TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES skill_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT,
  stack TEXT NOT NULL DEFAULT '[]',
  features TEXT NOT NULL DEFAULT '[]',
  repo_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  issue_date TEXT,
  credential_url TEXT,
  document_url TEXT,
  coverage TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS github_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  login TEXT NOT NULL DEFAULT 'romanytawfiq',
  last_sync_at TEXT,
  last_error TEXT,
  include_forks INTEGER NOT NULL DEFAULT 1,
  include_archived INTEGER NOT NULL DEFAULT 1,
  cache_minutes INTEGER NOT NULL DEFAULT 60
);

CREATE TABLE IF NOT EXISTS github_repos (
  github_id INTEGER PRIMARY KEY,
  owner_login TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  primary_language TEXT,
  topics TEXT NOT NULL DEFAULT '[]',
  stargazers_count INTEGER NOT NULL DEFAULT 0,
  is_fork INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  pushed_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  synced_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_skills_group ON skills(group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_repos_visible ON github_repos(hidden, featured, sort_order);
`;

let instance: DatabaseSync | undefined;

function count(db: DatabaseSync, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get();
  return Number(row?.total ?? 0);
}

function seed(db: DatabaseSync) {
  const now = SEED_TIMESTAMP;

  if (count(db, "site_settings") === 0) {
    db.prepare(
      `INSERT INTO site_settings
        (id, default_locale, theme_behavior, seo_title_en, seo_title_ar,
         seo_description_en, seo_description_ar, section_visibility, updated_at)
       VALUES (1, 'ar', 'system', ?, NULL, ?, NULL, ?, ?)`,
    ).run(
      messagesEn.Public.metaTitle,
      messagesEn.Public.metaDescription,
      JSON.stringify({
        about: true,
        skills: true,
        projects: true,
        github: true,
        certification: true,
        contact: true,
      }),
      now,
    );
  }

  if (count(db, "profile") === 0) {
    db.prepare(
      `INSERT INTO profile
        (id, name, title, location, summary_en, summary_ar, image_url, resume_url, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      profile.name,
      profile.title,
      profile.location,
      profile.summary,
      profile.summaryAr,
      profile.imageUrl,
      profile.resumeUrl,
      now,
    );
  }

  if (count(db, "contact_methods") === 0) {
    const insert = db.prepare(
      "INSERT INTO contact_methods (kind, value, visible, sort_order) VALUES (?, ?, 1, ?)",
    );
    insert.run("phone", contact.phone, 1);
    insert.run("whatsapp", contact.whatsapp, 2);
    insert.run("email", contact.email, 3);
  }

  if (count(db, "social_links") === 0) {
    const insert = db.prepare(
      "INSERT INTO social_links (platform, url, label, visible, sort_order) VALUES (?, ?, ?, 1, ?)",
    );
    insert.run("GitHub", contact.github, "GitHub", 1);
    insert.run("LinkedIn", contact.linkedin, "LinkedIn", 2);
    insert.run("Email", `mailto:${contact.email}`, "Email", 3);
  }

  if (count(db, "skill_groups") === 0) {
    const insertGroup = db.prepare(
      `INSERT INTO skill_groups (key, label_en, label_ar, visible, sort_order)
       VALUES (?, ?, ?, 1, ?)`,
    );
    const insertSkill = db.prepare(
      `INSERT INTO skills (group_id, name, visible, sort_order) VALUES (?, ?, 1, ?)`,
    );

    skillGroups.forEach((group, groupIndex) => {
      const result = insertGroup.run(
        group.id,
        messagesEn.Public.skills.groups[group.id as keyof typeof messagesEn.Public.skills.groups],
        messagesAr.Public.skills.groups[group.id as keyof typeof messagesAr.Public.skills.groups],
        groupIndex,
      );
      const groupId = Number(result.lastInsertRowid);
      group.skills.forEach((skill, skillIndex) => {
        insertSkill.run(groupId, skill, skillIndex);
      });
    });
  }

  if (count(db, "projects") === 0) {
    const insert = db.prepare(
      `INSERT INTO projects
        (slug, title, description_en, description_ar, stack, features,
         repo_url, demo_url, image_url, published, featured, sort_order,
         created_at, updated_at)
       VALUES (?, ?, ?, NULL, ?, ?, NULL, NULL, NULL, 1, 0, ?, ?, ?)`,
    );
    projects.forEach((project, index) => {
      insert.run(
        project.slug,
        project.title,
        project.description,
        JSON.stringify(project.stack),
        JSON.stringify(project.features),
        index,
        now,
        now,
      );
    });
  }

  // The seed list is derived from the certificate PDFs supplied by the owner.
  // Insert by title so an existing database gets new certificates without
  // overwriting any edits the admin has already made.
  const insertCertification = db.prepare(
    `INSERT INTO certifications
      (title, issuer, issue_date, credential_url, document_url, coverage,
       published, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
  );
  const findCertification = db.prepare(
    "SELECT id FROM certifications WHERE title = ?",
  );
  const linkCertificateFile = db.prepare(
    "UPDATE certifications SET document_url = ? WHERE title = ? AND document_url IS NULL",
  );
  certifications.forEach((certification, index) => {
    const existing = findCertification.get(certification.title);
    if (existing) {
      linkCertificateFile.run(certification.documentUrl, certification.title);
      return;
    }
    insertCertification.run(
      certification.title,
      certification.issuer,
      certification.issueDate,
      certification.credentialUrl,
      certification.documentUrl,
      JSON.stringify(certification.coverage),
      index,
      now,
      now,
    );
  });

  if (count(db, "github_sync_state") === 0) {
    db.prepare(
      `INSERT INTO github_sync_state
        (id, login, last_sync_at, last_error, include_forks, include_archived, cache_minutes)
       VALUES (1, ?, NULL, NULL, 1, 1, 60)`,
    ).run(process.env.GITHUB_REPO_OWNER ?? "romanytawfiq");
  }
}

export function getDb(): DatabaseSync {
  if (instance) return instance;

  const file = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.join(process.cwd(), ".data", "portfolio.sqlite");
  mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  // One-time cleanup: schema versions are no longer tracked in SQLite. New
  // databases never create this table; existing ones drop it on first open.
  db.exec("DROP TABLE IF EXISTS schema_migrations;");

  // Databases created before the certificate PDFs were added have no
  // document_url column. Add it without touching existing certificate rows.
  const certificationColumns = db.prepare("PRAGMA table_info(certifications)").all() as Array<{
    name: string;
  }>;
  if (!certificationColumns.some((column) => column.name === "document_url")) {
    db.exec("ALTER TABLE certifications ADD COLUMN document_url TEXT;");
  }

  // Older databases created before password login need this column before any
  // password session is issued or validated. The shared limiter table is
  // created by SCHEMA above, so every process sees the same attempt counts.
  const credentialColumns = db.prepare("PRAGMA table_info(admin_credentials)").all() as Array<{
    name: string;
  }>;
  if (!credentialColumns.some((column) => column.name === "auth_version")) {
    db.exec("ALTER TABLE admin_credentials ADD COLUMN auth_version TEXT;");
  }
  const legacyCredential = db
    .prepare("SELECT password_hash FROM admin_credentials WHERE id = 1 AND auth_version IS NULL")
    .get();
  if (legacyCredential) {
    const hash = String((legacyCredential as { password_hash: unknown }).password_hash ?? "");
    const version = createHash("sha256").update(hash).digest("hex").slice(0, 32);
    db.prepare("UPDATE admin_credentials SET auth_version = ? WHERE id = 1").run(version);
  }

  seed(db);

  instance = db;
  return db;
}
