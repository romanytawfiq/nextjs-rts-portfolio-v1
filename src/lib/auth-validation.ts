import { z } from "zod";

// Client-safe validation shared by the login form and the Auth.js credentials
// provider. The server still validates every submission; the browser copy is UX
// only.
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,64}$/;
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

export const loginSchema = z.object({
  username: z.string().trim().regex(USERNAME_PATTERN),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});
