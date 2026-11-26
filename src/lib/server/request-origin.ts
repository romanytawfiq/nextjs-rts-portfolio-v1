import { isIP } from "node:net";

import { isValidLoginClientId, LOGIN_CLIENT_COOKIE } from "@/lib/login-client";

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "::1" || /^127\.\d+\.\d+\.\d+$/.test(host);
}

// A forwarded header is trusted only when the deployment explicitly opts in.
// Header presence alone is never proof of a trusted proxy: any client can send
// `x-vercel-forwarded-for` or `x-forwarded-for` itself.
function trustedProxyHops(): number {
  const raw = process.env.TRUST_PROXY_HOPS;
  if (raw === undefined || raw === "") return 0;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10 ? parsed : 0;
}

export function clientIp(request: Request): string {
  if (process.env.TRUST_PROXY !== "1") return "local";

  // Prefer the last untrusted hop. With `X-Forwarded-For: $remote_addr` (or a
  // single proxy appending to a client-supplied value) this is the real client.
  // TRUST_PROXY_HOPS can drop additional rightmost trusted-proxy entries.
  const parts = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (parts.length === 0) return "unknown";

  const hops = Math.min(trustedProxyHops(), parts.length - 1);
  const candidate = parts[parts.length - 1 - hops] ?? "";
  const normalized = candidate.replace(/^\[|\]$/g, "");
  return isIP(normalized) ? normalized : "unknown";
}

// When no trusted proxy IP is available, use a server-issued browser cookie so
// unrelated visitors do not share one global lockout bucket. The cookie is set
// by proxy on the admin login response; attackers can clear it, but doing so
// cannot be used to turn a single global bucket into an account-wide DoS.
export function loginClientKey(request: Request): string {
  const ip = clientIp(request);
  if (ip !== "local" && ip !== "unknown") return ip;

  const cookies = request.headers.get("cookie") ?? "";
  const pattern = new RegExp(`(?:^|;\\s*)${LOGIN_CLIENT_COOKIE}=([0-9a-f]+)(?:;|$)`);
  const value = cookies.match(pattern)?.[1];
  return isValidLoginClientId(value) ? `browser:${value}` : "local";
}

export function isAllowedOrigin(request: Request, required = false): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return !required;

  const received = origin.replace(/\/$/, "");
  const allowed = new Set<string>();

  let configured: URL | null = null;
  try {
    configured = process.env.SITE_URL ? new URL(process.env.SITE_URL) : null;
  } catch {
    configured = null;
  }

  if (configured) {
    // In production the configured canonical origin is authoritative. Never
    // derive it from the Host header of the incoming request.
    allowed.add(configured.origin);

    // Next can normalize request.url to SITE_URL even when a local browser used
    // a loopback alias. Allow only those known aliases, never an arbitrary host.
    if (isLoopbackHost(configured.hostname)) {
      const port = configured.port ? `:${configured.port}` : "";
      for (const alias of ["localhost", "127.0.0.1", "[::1]"]) {
        allowed.add(`${configured.protocol}//${alias}${port}`);
      }
    }
  } else {
    try {
      allowed.add(new URL(request.url).origin);
    } catch {
      return false;
    }
  }

  return allowed.has(received);
}
