// Edge-safe constants shared by proxy and server code. Do not import
// node-only modules here.
export const LOGIN_CLIENT_COOKIE = "rts_login_client";

export function isValidLoginClientId(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}$/.test(value);
}
