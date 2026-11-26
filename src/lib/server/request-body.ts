export const MAX_JSON_BODY_BYTES = 256 * 1024;

export class BodyTooLargeError extends Error {
  constructor() {
    super("Request body too large.");
    this.name = "BodyTooLargeError";
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) throw new BodyTooLargeError();

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new BodyTooLargeError();
  if (!text.trim()) return {};
  return JSON.parse(text);
}
