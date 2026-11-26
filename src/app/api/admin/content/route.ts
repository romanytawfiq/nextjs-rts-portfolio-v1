import { revalidatePath } from "next/cache";

import { authorizeApi } from "@/lib/server/auth";
import { getAdminContent, updateSection } from "@/lib/server/content";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { BodyTooLargeError, readJsonBody } from "@/lib/server/request-body";
import { contentMutationSchema, isSectionKey, sectionSchemas } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  const content = getAdminContent();
  return Response.json({ sections: content.sections, sync: content.sync });
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  const rate = checkRateLimit(`content:${auth.session.sub}`, 60, 10 * 60_000);
  if (!rate.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return Response.json({ error: "payload_too_large" }, { status: 413 });
    }
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = contentMutationSchema.safeParse(body);
  if (!parsed.success || !isSectionKey(parsed.data.section)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }
  if (!sectionSchemas[parsed.data.section].safeParse(parsed.data.values).success) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    updateSection(parsed.data.section, parsed.data.values, auth.session);
  } catch {
    return Response.json({ error: "validation_failed" }, { status: 400 });
  }

  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/admin");
  revalidatePath("/ar/admin");

  return Response.json({ ok: true, section: parsed.data.section });
}
