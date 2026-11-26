import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

// Assumes an existing production build (`next build`) in the repo's `.next`.
// Run with: node --test tests/smoke.test.mjs

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const setPasswordScript = path.join(repoRoot, "scripts", "set-admin-password.mjs");

const RETRY_DELAY_MS = 200;
const READY_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

let tempDir;
let sqlitePath;
let baseUrl;
let origin;
let server;
let serverOutput = "";
let serverError;
let adminUsername;
let adminPassword;
let sessionCookie;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close(() => reject(new Error("Could not determine a free TCP port.")));
        return;
      }
      const { port } = address;
      probe.close(() => resolve(port));
    });
  });
}

function runNode(scriptPath, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-20_000);
    });
    child.stderr?.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-20_000);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with ${code}: ${output}`));
    });
  });
}

function appendServerOutput(chunk) {
  serverOutput = `${serverOutput}${chunk}`.slice(-20_000);
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off("exit", onExit);
      resolve(false);
    }, timeoutMs);
    function onExit() {
      clearTimeout(timer);
      resolve(true);
    }
    child.once("exit", onExit);
  });
}

async function killServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  if (process.platform === "win32" && child.pid) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("close", resolve);
      killer.once("error", resolve);
    });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      try {
        child.kill("SIGTERM");
      } catch {
        // Already gone.
      }
    }
  }

  if (!(await waitForExit(child, 5_000))) {
    try {
      child.kill("SIGKILL");
    } catch {
      // Already gone.
    }
    await waitForExit(child, 2_000);
  }
}

async function waitForReady(child) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastError = "server did not respond";

  while (Date.now() < deadline) {
    if (serverError) throw serverError;
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Production server exited early (${child.exitCode ?? child.signalCode}):\n${serverOutput}`);
    }

    try {
      const response = await fetch(new URL("/en", baseUrl), {
        redirect: "manual",
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(RETRY_DELAY_MS);
  }

  throw new Error(`Production server was not ready: ${lastError}\n${serverOutput}`);
}

function request(pathname, options = {}) {
  const {
    method = "GET",
    headers: extraHeaders = {},
    body,
    formBody,
    cookie,
    redirect = "manual",
    withOrigin = true,
  } = options;

  const headers = { ...extraHeaders };
  if (withOrigin && !headers.origin && !headers.Origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;

  let payload;
  if (formBody !== undefined) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    payload = formBody.toString();
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = typeof body === "string" ? body : JSON.stringify(body);
  }

  return fetch(new URL(pathname, baseUrl), {
    method,
    headers,
    body: payload,
    redirect,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function readJson(response, expectedStatus) {
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  assert.equal(
    response.status,
    expectedStatus,
    `expected HTTP ${expectedStatus}, got ${response.status}; body: ${text}`,
  );
  return parsed;
}

function setCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function findSessionCookie(response) {
  return setCookies(response).find((value) => /authjs\.session-token=/i.test(value));
}

function tamperSessionCookie(cookie) {
  const equals = cookie.indexOf("=");
  assert.ok(equals > 0, "unexpected session cookie format");
  const name = cookie.slice(0, equals + 1);
  const value = cookie.slice(equals + 1);
  assert.ok(value.length > 0, "unexpected session cookie value");
  // Mutate the first byte of the encrypted payload segment. Changing the last
  // base64url character can be a no-op because its trailing bits are padding.
  const firstDot = value.indexOf(".");
  const index = firstDot > 0 ? firstDot + 1 : 0;
  const original = value[index] ?? "A";
  const replacement = original === "A" ? "B" : "A";
  const changed = `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;
  return `${name}${changed}`;
}

async function authCsrf() {
  const response = await request("/api/auth/csrf");
  const body = await readJson(response, 200);
  assert.ok(body.csrfToken, "Auth.js did not return a CSRF token");
  const cookie = setCookies(response).find((value) => /authjs\.csrf-token=/i.test(value));
  assert.ok(cookie, "Auth.js did not set a CSRF cookie");
  return { token: body.csrfToken, cookie: cookie.split(";")[0].trim() };
}

async function authCallback(path, params, extra = {}) {
  const csrf = await authCsrf();
  const response = await request(path, {
    method: "POST",
    ...extra,
    cookie: extra.cookie ? `${extra.cookie}; ${csrf.cookie}` : csrf.cookie,
    formBody: new URLSearchParams({
      csrfToken: csrf.token,
      callbackUrl: "/en/admin",
      ...params,
    }),
    headers: { "x-auth-return-redirect": "1", ...extra.headers },
  });
  const body = await readJson(response, 200);
  assert.ok(typeof body.url === "string", "Auth.js did not return a redirect URL");
  return { response, url: new URL(body.url, baseUrl) };
}

function markSyncCached() {
  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec("PRAGMA busy_timeout = 5000;");
    const now = new Date().toISOString();
    const update = db
      .prepare("UPDATE github_sync_state SET last_sync_at = ?, last_error = NULL WHERE id = 1")
      .run(now);
    if (Number(update.changes) === 0) {
      db.prepare(
        `INSERT INTO github_sync_state
          (id, login, last_sync_at, last_error, include_forks, include_archived, cache_minutes)
         VALUES (1, ?, ?, NULL, 1, 1, 60)`,
      ).run("smoke-owner", now);
    }
  } finally {
    db.close();
  }
}

before(async () => {
  if (!existsSync(path.join(repoRoot, ".next", "BUILD_ID"))) {
    throw new Error("No production build found. Run `npm run build` before this smoke test.");
  }

  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  origin = baseUrl;

  tempDir = mkdtempSync(path.join(tmpdir(), "rts-portfolio-smoke-"));
  sqlitePath = path.join(tempDir, "portfolio.sqlite");

  adminUsername = `smoke-admin-${randomBytes(4).toString("hex")}`;
  adminPassword = `SmokePass_${randomBytes(12).toString("base64url")}`;

  await runNode(setPasswordScript, {
    ...process.env,
    SQLITE_PATH: sqlitePath,
    ADMIN_USERNAME: adminUsername,
    ADMIN_PASSWORD: adminPassword,
    NEXT_TELEMETRY_DISABLED: "1",
  });

  const serverEnv = {
    ...process.env,
    NODE_ENV: "production",
    SQLITE_PATH: sqlitePath,
    AUTH_SECRET: randomBytes(48).toString("base64url"),
    AUTH_TRUST_HOST: "1",
    AUTH_URL: baseUrl,
    AUTH_GITHUB_ID: "smoke-client-id",
    AUTH_GITHUB_SECRET: "smoke-client-secret",
    GITHUB_ADMIN_ID: "4242424242",
    GITHUB_REPO_OWNER: "smoke-owner",
    GITHUB_TOKEN: "",
    SITE_URL: baseUrl,
    // Keep proxy-forwarded IP spoofing from creating fresh rate-limit buckets.
    TRUST_PROXY: "",
    NEXT_TELEMETRY_DISABLED: "1",
  };

  server = spawn(
    process.execPath,
    [nextBin, "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: repoRoot,
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: true,
    },
  );
  server.stdout?.on("data", appendServerOutput);
  server.stderr?.on("data", appendServerOutput);
  server.once("error", (error) => {
    serverError = error;
  });

  await waitForReady(server);
});

after(async () => {
  await killServer(server);
  if (!tempDir) return;

  for (let attempt = 0; ; attempt += 1) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt >= 4) throw error;
      await sleep(RETRY_DELAY_MS);
    }
  }
});

test("production auth, CMS, sync, OAuth and public smoke flow", { timeout: 120_000 }, async () => {
  const initialPage = await request("/en", { withOrigin: false });
  assert.equal(initialPage.headers.get("x-content-type-options"), "nosniff");
  assert.equal(initialPage.headers.get("x-frame-options"), "DENY");
  assert.ok(initialPage.headers.get("content-security-policy"));
  assert.equal(initialPage.headers.get("x-powered-by"), null);

  // Signed-out API access and admin page protection.
  const unauthenticated = await request("/api/admin/content");
  const unauthenticatedBody = await readJson(unauthenticated, 401);
  assert.equal(unauthenticatedBody.error, "unauthorized");

  const adminRedirect = await request("/en/admin");
  assert.equal(adminRedirect.status, 307);
  assert.match(adminRedirect.headers.get("location") ?? "", /\/en\/admin\/login(?:$|[?#])/);

  // Owner-approved default locale: "/" resolves to Arabic.
  const rootRedirect = await request("/", { withOrigin: false });
  assert.equal(rootRedirect.status, 307);
  assert.match(rootRedirect.headers.get("location") ?? "", /\/ar(?:$|[?#])/);

  // Auth.js error redirects keep the requested locale and use existing messages.
  const localizedError = await request("/api/auth/error-page?error=AccessDenied", {
    cookie: "rts_auth_locale=ar",
  });
  assert.equal(localizedError.status, 307);
  assert.match(
    localizedError.headers.get("location") ?? "",
    /\/ar\/admin\/login\?error=forbidden$/,
  );

  const unknownError = await request("/api/auth/error-page?error=Unexpected", {
    cookie: "rts_auth_locale=en",
  });
  assert.equal(unknownError.status, 307);
  assert.match(
    unknownError.headers.get("location") ?? "",
    /\/en\/admin\/login\?error=oauth_failed$/,
  );

  // Auth.js password flow: origin, payload and credential error codes.
  const badOrigin = await authCallback(
    "/api/auth/callback/credentials",
    { username: adminUsername, password: adminPassword },
    { headers: { origin: "https://evil.example" } },
  );
  assert.equal(badOrigin.url.searchParams.get("error"), "CredentialsSignin");
  assert.equal(badOrigin.url.searchParams.get("code"), "invalid_origin");

  const invalidPayload = await authCallback("/api/auth/callback/credentials", {
    username: "x",
    password: "short",
  });
  assert.equal(invalidPayload.url.searchParams.get("error"), "CredentialsSignin");
  assert.equal(invalidPayload.url.searchParams.get("code"), "invalid_payload");

  const login = await authCallback("/api/auth/callback/credentials", {
    username: adminUsername,
    password: adminPassword,
  });
  assert.equal(login.url.pathname, "/en/admin");
  const issued = findSessionCookie(login.response);
  assert.ok(issued, "Auth.js did not issue a session cookie");
  assert.match(issued, /authjs\.session-token=/i);
  assert.match(issued, /;\s*HttpOnly/i);
  assert.match(issued, /;\s*SameSite=Lax/i);
  sessionCookie = issued.split(";")[0].trim();

  const tampered = await request("/api/admin/content", {
    cookie: tamperSessionCookie(sessionCookie),
  });
  assert.equal(tampered.status, 401);

  // CMS mutation validation and a real mutation.
  const invalidPatch = await request("/api/admin/content", {
    method: "PATCH",
    cookie: sessionCookie,
    body: {
      section: "githubSettings",
      values: { includeForks: true, includeArchived: true, cacheMinutes: 1 },
    },
  });
  const invalidPatchBody = await readJson(invalidPatch, 400);
  assert.ok(invalidPatchBody.error);

  const validPatch = await request("/api/admin/content", {
    method: "PATCH",
    cookie: sessionCookie,
    body: {
      section: "githubSettings",
      values: { includeForks: true, includeArchived: true, cacheMinutes: 60 },
    },
  });
  const validPatchBody = await readJson(validPatch, 200);
  assert.equal(validPatchBody.ok, true);
  assert.equal(validPatchBody.section, "githubSettings");

  const missingOrigin = await request("/api/admin/content", {
    method: "PATCH",
    cookie: sessionCookie,
    withOrigin: false,
    body: {
      section: "githubSettings",
      values: { includeForks: false, includeArchived: true, cacheMinutes: 60 },
    },
  });
  const missingOriginBody = await readJson(missingOrigin, 403);
  assert.equal(missingOriginBody.error, "invalid_origin");

  const unsafeUrl = await request("/api/admin/content", {
    method: "PATCH",
    cookie: sessionCookie,
    body: {
      section: "socialLinks",
      values: [
        {
          platform: "site",
          url: "javascript:alert(1)",
          label: "Site",
          visible: true,
          sortOrder: 0,
        },
      ],
    },
  });
  const unsafeUrlBody = await readJson(unsafeUrl, 400);
  assert.equal(unsafeUrlBody.error, "invalid_payload");

  // Sync validation, then a cached sync (no GitHub network call).
  markSyncCached();

  const malformedSync = await request("/api/admin/github/sync", {
    method: "POST",
    cookie: sessionCookie,
    body: "{not json",
  });
  const malformedSyncBody = await readJson(malformedSync, 400);
  assert.equal(malformedSyncBody.error, "invalid_json");

  const extraFieldSync = await request("/api/admin/github/sync", {
    method: "POST",
    cookie: sessionCookie,
    body: { force: false, unexpected: true },
  });
  const extraFieldSyncBody = await readJson(extraFieldSync, 400);
  assert.equal(extraFieldSyncBody.error, "invalid_payload");

  const cachedSync = await request("/api/admin/github/sync", {
    method: "POST",
    cookie: sessionCookie,
    body: {},
  });
  const cachedSyncBody = await readJson(cachedSync, 200);
  assert.equal(cachedSyncBody.ok, true);
  assert.equal(cachedSyncBody.cached, true);

  const oversizedSync = await request("/api/admin/github/sync", {
    method: "POST",
    cookie: sessionCookie,
    body: "x".repeat(300 * 1024),
  });
  const oversizedSyncBody = await readJson(oversizedSync, 413);
  assert.equal(oversizedSyncBody.error, "payload_too_large");

  // Six valid sync calls per actor per window are allowed; the seventh is throttled.
  // Invalid and oversized payloads are rejected before consuming a token.
  for (let call = 0; call < 5; call += 1) {
    const withinLimit = await request("/api/admin/github/sync", {
      method: "POST",
      cookie: sessionCookie,
      body: {},
    });
    await readJson(withinLimit, 200);
  }
  const throttledSync = await request("/api/admin/github/sync", {
    method: "POST",
    cookie: sessionCookie,
    body: {},
  });
  const throttledBody = await readJson(throttledSync, 429);
  assert.equal(throttledBody.error, "rate_limited");
  assert.ok(Number(throttledSync.headers.get("retry-after")) > 0);

  // Auth.js builds the GitHub authorization URL with the minimal scope.
  const oauthStart = await authCallback("/api/auth/signin/github", {});
  assert.match(oauthStart.url.toString(), /^https:\/\/github\.com\/login\/oauth\/authorize\?/);
  assert.equal(oauthStart.url.searchParams.get("scope"), "read:user");
  assert.equal(oauthStart.url.searchParams.get("client_id"), "smoke-client-id");
  assert.doesNotMatch(oauthStart.url.toString(), /(?:\?|&)scope=[^&]*repo/i);

  // Auth.js sign-out clears the session cookie used by subsequent requests.
  const logout = await authCallback(
    "/api/auth/signout",
    { callbackUrl: "/en/admin/login" },
    { cookie: sessionCookie },
  );
  assert.equal(logout.url.pathname, "/en/admin/login");
  const cleared = findSessionCookie(logout.response);
  assert.ok(cleared, "Auth.js did not clear the session cookie");
  sessionCookie = cleared.split(";")[0].trim();

  const afterLogout = await request("/api/admin/content", { cookie: sessionCookie });
  assert.equal(afterLogout.status, 401);

  // Brute-force limiter: unique username, five failures, then a blocked code.
  const rateUsername = `smoke-rate-${randomBytes(5).toString("hex")}`;
  const wrongPassword = `WrongPass_${randomBytes(12).toString("base64url")}`;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = await authCallback("/api/auth/callback/credentials", {
      username: rateUsername,
      password: wrongPassword,
    });
    assert.equal(
      result.url.searchParams.get("code"),
      "invalid_credentials",
      `attempt ${attempt} did not return invalid_credentials`,
    );
  }

  const limited = await authCallback("/api/auth/callback/credentials", {
    username: rateUsername,
    password: wrongPassword,
  });
  assert.equal(limited.url.searchParams.get("error"), "CredentialsSignin");
  assert.equal(limited.url.searchParams.get("code"), "too_many_attempts");

  const spoofed = await authCallback(
    "/api/auth/callback/credentials",
    { username: rateUsername, password: wrongPassword },
    { headers: { "x-forwarded-for": "203.0.113.77" } },
  );
  assert.equal(spoofed.url.searchParams.get("code"), "too_many_attempts");

  // The Vercel-specific header is never trusted by header presence alone.
  const spoofedVercel = await authCallback(
    "/api/auth/callback/credentials",
    { username: rateUsername, password: wrongPassword },
    { headers: { "x-vercel-forwarded-for": "203.0.113.78" } },
  );
  assert.equal(spoofedVercel.url.searchParams.get("code"), "too_many_attempts");

  // Health endpoint confirms the isolated database is reachable.
  const health = await request("/api/health", { withOrigin: false });
  const healthBody = await readJson(health, 200);
  assert.equal(healthBody.ok, true);

  // Public pages render with the expected document direction markers.
  for (const [locale, direction] of [
    ["en", "ltr"],
    ["ar", "rtl"],
  ]) {
    const page = await request(`/${locale}`, { withOrigin: false });
    assert.equal(page.status, 200);
    const html = await page.text();
    const htmlTag = html.match(/<html\b([^>]*)>/i);
    assert.ok(htmlTag, `${locale} page has no <html> tag`);
    assert.match(htmlTag[1], new RegExp(`\\blang="${locale}"`));
    assert.match(htmlTag[1], new RegExp(`\\bdir="${direction}"`));
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
    assert.match(title, locale === "ar" ? /روماني/ : /Romany/, `${locale} title uses the wrong locale`);
    assert.match(
      html,
      /<meta\s+name="description"\s+content="[^"]+"/i,
      `${locale} page has no meta description`,
    );

    // Motion wrappers must be present in the server-rendered HTML but must
    // never hide content while JavaScript or the IntersectionObserver is absent.
    assert.match(html, /data-reveal(?:="")?/, `${locale} page has no reveal wrappers`);
    assert.match(
      html,
      /data-scroll-progress(?:="")?/,
      `${locale} page has no scroll progress indicator`,
    );
    assert.doesNotMatch(
      html,
      /\bopacity:\s*0(?:;|")/,
      `${locale} reveal animation hides content`,
    );

    // Footer carries the owner's CV-verified details, the owner-approved email
    // address and copyright notice in both locales.
    assert.match(html, /Romany Tawfiq Shehata/, `${locale} footer has no owner name`);
    assert.match(html, /tel:\+201201777051/, `${locale} footer has no phone link`);
    assert.match(
      html,
      /web\.whatsapp\.com\/send\?phone=201006985069/,
      `${locale} footer has no WhatsApp link`,
    );
    assert.match(html, /github\.com\/romanytawfiq/i, `${locale} footer has no GitHub link`);
    assert.match(
      html,
      /linkedin\.com\/in\/romany-t-shehata-832639386/i,
      `${locale} footer has no LinkedIn link`,
    );
    assert.match(
      html,
      /mailto:romanytawfiqshehata@gmail\.com/i,
      `${locale} page has no owner-approved email link`,
    );

    // Owner-supplied certificates are all published with their PDF files.
    assert.match(
      html,
      /MongoDB - The Complete Developer's Guide 2023/,
      `${locale} page has no owner-supplied certificates`,
    );
    const certificateLinks = html.match(/\/certificates\/[a-z0-9-]+\.pdf/gi) ?? [];
    assert.equal(
      new Set(certificateLinks).size,
      15,
      `${locale} page must link all 15 certificate PDFs`,
    );
    assert.match(
      html,
      locale === "ar" ? /جميع الحقوق محفوظة\./ : /All rights reserved\./,
      `${locale} footer has no copyright notice`,
    );
  }
});
