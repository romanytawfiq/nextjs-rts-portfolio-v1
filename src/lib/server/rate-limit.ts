import { getDb } from "@/lib/server/db";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

// Small durable rate limiter for authenticated admin mutations. It shares the
// SQLite file with the CMS so it is consistent across processes.
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const db = getDb();
  const row = db
    .prepare("SELECT count, reset_at FROM api_rate_limits WHERE limit_key = ?")
    .get(key) as { count: number; reset_at: number } | undefined;

  const resetAt = row ? Number(row.reset_at) : 0;
  if (!row || !Number.isFinite(resetAt) || resetAt <= now) {
    db.prepare(
      `INSERT INTO api_rate_limits (limit_key, count, reset_at)
       VALUES (?, 1, ?)
       ON CONFLICT(limit_key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
    ).run(key, now + windowMs);
    return { ok: true };
  }

  const count = Number(row.count) + 1;
  db.prepare("UPDATE api_rate_limits SET count = ? WHERE limit_key = ?").run(count, key);
  if (count > maxRequests) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  }
  return { ok: true };
}
