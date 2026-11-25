import { revalidatePath } from "next/cache";

import { authorizeApi } from "@/lib/server/auth";
import { getAdminContent, updateSection } from "@/lib/server/content";
import { contentMutationSchema, isSectionKey } from "@/lib/schemas/cms";

export async function GET(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  const content = getAdminContent();
  return Response.json({ sections: content.sections, sync: content.sync });
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = contentMutationSchema.safeParse(body);
  if (!parsed.success || !isSectionKey(parsed.data.section)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    updateSection(parsed.data.section, parsed.data.values, auth.session.sub);
  } catch {
    return Response.json({ error: "validation_failed" }, { status: 400 });
  }

  revalidatePath("/en");
  revalidatePath("/ar");
  revalidatePath("/en/admin");
  revalidatePath("/ar/admin");

  return Response.json({ ok: true, section: parsed.data.section });
}
