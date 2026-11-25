import type { Instrumentation } from "next";

function safePath(value: string): string {
  try {
    const url = new URL(value, "http://local.invalid");
    // Query strings can carry tokens or personal data. Record only the path.
    return url.pathname;
  } catch {
    return "<invalid-path>";
  }
}

// Host log collectors can ingest this structured stderr line. No request
// headers, cookies, bodies, or query values are logged.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : undefined;

  console.error(
    JSON.stringify({
      event: "request_error",
      at: new Date().toISOString(),
      message,
      digest,
      method: request.method,
      path: safePath(request.path),
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    }),
  );
};
