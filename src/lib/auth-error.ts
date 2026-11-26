export const AUTH_LOCALE_COOKIE = "rts_auth_locale";

export function parseAuthLocale(value: string | null | undefined): "en" | "ar" {
  return value === "en" ? "en" : "ar";
}

// Map Auth.js error names to the existing owner-approved login message keys.
// Do not invent new copy here.
export function normalizeAuthErrorCode(
  error: string | null | undefined,
  code: string | null | undefined,
): string {
  if (error === "AccessDenied") return "forbidden";

  if (error === "CredentialsSignin") {
    if (code === "too_many_attempts") return "too_many_attempts";
    if (code === "invalid_payload") return "invalid_payload";
    if (code === "invalid_origin") return "invalid_origin";
    if (code === "not_configured") return "not_configured";
    return "invalid_credentials";
  }

  if (error === "Configuration" || error === "MissingSecret") return "not_configured";
  if (error === "InvalidCheck" || error === "InvalidCallbackUrl") return "invalid_state";
  if (error === "OAuthCallbackError" || error === "CallbackRouteError") return "oauth_denied";

  return "oauth_failed";
}
