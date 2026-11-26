import { getDb } from "@/lib/server/db";

// Authorization state must not be mutated by login/audit helpers. A missing
// row means genuine first sign-in; an existing disabled row is an explicit
// revocation and must stay disabled until an operator re-enables it.
export function isGithubLoginAllowed(githubId: number): boolean {
  const row = getDb()
    .prepare("SELECT enabled FROM admin_allowlist WHERE github_id = ?")
    .get(githubId) as { enabled: unknown } | undefined;
  if (!row) return true;
  return Number(row.enabled) === 1;
}
