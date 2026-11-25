import axios from "axios";

import { audit } from "@/lib/server/content";
import { getDb } from "@/lib/server/db";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics?: string[];
  stargazers_count?: number;
  fork?: boolean;
  archived?: boolean;
  pushed_at?: string | null;
  owner?: { login?: string };
};

export type SyncResult = {
  ok: boolean;
  synced: number;
  lastSyncAt: string | null;
  cached?: boolean;
  error?: string;
};

const MAX_PAGES = 10;

function rowString(row: Record<string, unknown> | undefined, key: string) {
  return String(row?.[key] ?? "");
}

export async function syncPublicRepos(
  actorId: number | null,
  options: { force?: boolean } = {},
): Promise<SyncResult> {
  const db = getDb();
  const state = db.prepare("SELECT * FROM github_sync_state WHERE id = 1").get();
  const login = process.env.GITHUB_REPO_OWNER?.trim() || rowString(state, "login");
  const lastSyncAt = rowString(state, "last_sync_at");
  const cacheMinutes = Number(state?.cache_minutes ?? 60);
  const includeForks = Number(state?.include_forks ?? 0) === 1;
  const includeArchived = Number(state?.include_archived ?? 0) === 1;
  const token = process.env.GITHUB_TOKEN?.trim();
  const repos: GitHubRepo[] = [];

  if (!options.force && lastSyncAt) {
    const ageMs = Date.now() - new Date(lastSyncAt).getTime();
    if (Number.isFinite(ageMs) && ageMs < cacheMinutes * 60_000) {
      const cached = db.prepare("SELECT COUNT(*) AS total FROM github_repos").get();
      return {
        ok: true,
        synced: Number(cached?.total ?? 0),
        lastSyncAt,
        cached: true,
      };
    }
  }

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await axios.get<GitHubRepo[]>(
        `https://api.github.com/users/${encodeURIComponent(login)}/repos`,
        {
          params: { per_page: 100, page, type: "owner", sort: "updated", direction: "desc" },
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "rts-portfolio",
            "X-GitHub-Api-Version": "2022-11-28",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 10_000,
          validateStatus: () => true,
        },
      );

      if (response.status === 403 || response.status === 429) {
        const reset = Number(response.headers["x-ratelimit-reset"] ?? 0);
        const resetText = reset ? new Date(reset * 1000).toISOString() : "later";
        throw new Error(`GitHub rate limit reached. Try again after ${resetText}.`);
      }
      if (response.status !== 200) {
        throw new Error(`GitHub API returned ${response.status}.`);
      }

      const batch = Array.isArray(response.data) ? response.data : [];
      repos.push(...batch);
      if (batch.length < 100) break;
    }

    const now = new Date().toISOString();
    const upsert = db.prepare(
      `INSERT INTO github_repos (
        github_id, owner_login, name, full_name, description, html_url,
        primary_language, topics, stargazers_count, is_fork, is_archived,
        pushed_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(github_id) DO UPDATE SET
        owner_login = excluded.owner_login,
        name = excluded.name,
        full_name = excluded.full_name,
        description = excluded.description,
        html_url = excluded.html_url,
        primary_language = excluded.primary_language,
        topics = excluded.topics,
        stargazers_count = excluded.stargazers_count,
        is_fork = excluded.is_fork,
        is_archived = excluded.is_archived,
        pushed_at = excluded.pushed_at,
        synced_at = excluded.synced_at`,
    );

    let synced = 0;
    db.exec("BEGIN");
    try {
      for (const repo of repos) {
        if (!includeForks && repo.fork) continue;
        if (!includeArchived && repo.archived) continue;
        if (!Number.isInteger(repo.id) || repo.id <= 0) continue;
        upsert.run(
          repo.id,
          repo.owner?.login ?? login,
          repo.name,
          repo.full_name,
          repo.description ?? null,
          repo.html_url,
          repo.language ?? null,
          JSON.stringify(Array.isArray(repo.topics) ? repo.topics : []),
          Number(repo.stargazers_count ?? 0),
          repo.fork ? 1 : 0,
          repo.archived ? 1 : 0,
          repo.pushed_at ?? null,
          now,
        );
        synced += 1;
      }
      db.prepare(
        "UPDATE github_sync_state SET login = ?, last_sync_at = ?, last_error = NULL WHERE id = 1",
      ).run(login, now);
      audit(db, actorId, "github.sync", `${synced} repositories`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return { ok: true, synced, lastSyncAt: now };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown GitHub sync error";
    db.prepare("UPDATE github_sync_state SET last_error = ? WHERE id = 1").run(message.slice(0, 500));
    audit(db, actorId, "github.sync_failed", message);
    const lastSync = db.prepare("SELECT last_sync_at FROM github_sync_state WHERE id = 1").get();
    return {
      ok: false,
      synced: 0,
      lastSyncAt: rowString(lastSync, "last_sync_at") || null,
      error: message,
    };
  }
}
