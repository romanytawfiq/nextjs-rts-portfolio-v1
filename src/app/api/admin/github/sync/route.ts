import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authorizeApi } from "@/lib/server/auth";
import { syncPublicRepos } from "@/lib/server/github";

const syncBodySchema = z
  .object({ force: z.boolean().optional() })
  .strict();

export async function POST(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  let force = false;
  const text = await request.text();
  if (text.trim()) {
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = syncBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "invalid_payload" }, { status: 400 });
    }
    force = parsed.data.force ?? false;
  }

  const result = await syncPublicRepos(auth.session.sub, { force });
  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/admin/github");
  revalidatePath("/ar/admin/github");

  return Response.json(result, { status: result.ok ? 200 : 502 });
}
