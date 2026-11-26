function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "::1" || /^127\.\d+\.\d+\.\d+$/.test(host);
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const received = origin.replace(/\/$/, "");
  const requestUrl = new URL(request.url);
  const allowed = new Set<string>([requestUrl.origin]);

  let configured: URL | null = null;
  try {
    configured = process.env.SITE_URL ? new URL(process.env.SITE_URL) : null;
  } catch {
    configured = null;
  }
  if (configured) {
    allowed.add(configured.origin);

    // Next can normalize request.url to SITE_URL even when the browser used a
    // loopback alias. Allow only the same loopback aliases, never an arbitrary
    // Host header supplied by a caller.
    if (isLoopbackHost(configured.hostname)) {
      const port = configured.port ? `:${configured.port}` : "";
      for (const alias of ["localhost", "127.0.0.1", "[::1]"]) {
        allowed.add(`${configured.protocol}//${alias}${port}`);
      }
    }
  }

  return allowed.has(received);
}

export function clientIp(request: Request): string {
  // Only trust proxy-supplied IPs when the deployment explicitly says so, or
  // when the platform header is present. Otherwise a client could spoof the
  // header and start a fresh rate-limit bucket on every attempt.
  const trustedProxy =
    process.env.TRUST_PROXY === "1" || Boolean(request.headers.get("x-vercel-forwarded-for"));
  if (!trustedProxy) return "local";

  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}
