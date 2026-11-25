import Link from "next/link";

import { PasswordLogin } from "@/components/admin/password-login";
import { GitHubIcon } from "@/components/icons";
import { getAdminCopy } from "@/lib/admin-i18n";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { getSession, isOAuthConfigured } from "@/lib/server/auth";
import { isPasswordLoginConfigured } from "@/lib/server/password";

export default async function AdminLoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/login">) {
  const { locale } = await params;
  const { error } = await searchParams;
  const activeLocale = isLocale(locale) ? locale : defaultLocale;
  const c = await getAdminCopy(activeLocale);
  const page = c.pages.login;
  const githubConfigured = isOAuthConfigured();
  const passwordConfigured = isPasswordLoginConfigured();
  const session = await getSession();
  const errorCode = typeof error === "string" ? error : undefined;
  const errors = c.login.errors as Record<string, string>;
  const errorMessage = errorCode ? errors[errorCode] ?? errors.oauth_failed : null;

  return (
    <main id="main" className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">RTS / ADMIN</p>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">{page.title}</h1>
        <p className="mt-2 text-sm text-muted">{page.subtitle}</p>
        <p className="mt-6 rounded-lg border border-line bg-background px-4 py-3 text-xs text-muted">
          {c.login.note}
        </p>

        {errorMessage && (
          <p className="mt-4 rounded-lg border border-accent/50 bg-accent-soft px-4 py-3 text-xs text-accent">
            {errorMessage}
          </p>
        )}

        {session ? (
          <Link
            href={`/${activeLocale}/admin`}
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background"
          >
            {c.login.signedIn}
          </Link>
        ) : (
          <>
            <PasswordLogin
              locale={activeLocale}
              configured={passwordConfigured}
              labels={{
                title: c.login.passwordTitle,
                username: c.login.username,
                password: c.login.password,
                button: c.login.passwordButton,
                setup: c.login.passwordSetup,
                errors: c.login.errors,
              }}
            />

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
              <span className="h-px flex-1 bg-line" />
              {c.login.separator}
              <span className="h-px flex-1 bg-line" />
            </div>

            {githubConfigured ? (
              <a
                href={`/api/auth/github/start?locale=${activeLocale}`}
                className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-foreground transition-opacity hover:opacity-90"
              >
                <GitHubIcon className="size-5" />
                {c.login.button}
              </a>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium text-foreground opacity-50"
                >
                  <GitHubIcon className="size-5" />
                  {c.login.button}
                </button>
                {!passwordConfigured && (
                  <p className="mt-4 text-xs leading-6 text-muted">{c.login.setup}</p>
                )}
              </>
            )}
          </>
        )}

        <Link
          href={`/${activeLocale}`}
          className="mt-6 inline-flex text-sm text-accent underline decoration-accent/40 underline-offset-4"
        >
          {c.login.back}
        </Link>
      </div>
    </main>
  );
}
