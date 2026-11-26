import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authorizeApi } from "@/lib/server/auth";
import { syncPublicRepos } from "@/lib/server/github";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { BodyTooLargeError, readJsonBody } from "@/lib/server/request-body";

const syncBodySchema = z
  .object({ force: z.boolean().optional() })
  .strict();

export async function POST(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    }
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = syncBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const rate = checkRateLimit(`github-sync:${auth.session.sub}`, 6, 10 * 60_000);
  if (!rate.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const result = await syncPublicRepos(auth.session.sub, { force: parsed.data.force ?? false });
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/admin/github");
  revalidatePath("/ar/admin/github");

  return Response.json(result, { status: result.ok ? 200 : 502 });
}
