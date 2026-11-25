"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { primaryButtonClass } from "@/components/admin/ui";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,64}$/;
const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 200;

const schema = z.object({
  username: z.string().trim().regex(USERNAME_PATTERN),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

type FormValues = z.infer<typeof schema>;

export function PasswordLogin({
  locale,
  configured,
  labels,
}: {
  locale: "en" | "ar";
  configured: boolean;
  labels: {
    title: string;
    username: string;
    password: string;
    button: string;
    setup: string;
    errors: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { username: "", password: "" },
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(async (values) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(labels.errors.invalid_payload);
      return;
    }

    setError(null);
    try {
      await axios.post("/api/auth/password/login", parsed.data);
      router.replace(`/${locale}/admin`);
      router.refresh();
    } catch (caught) {
      const code = axios.isAxiosError(caught)
        ? String(caught.response?.data?.error ?? "invalid_credentials")
        : "invalid_credentials";
      setError(labels.errors[code] ?? labels.errors.invalid_credentials);
    }
  });

  return (
    <form onSubmit={onSubmit} className="mt-8 border-t border-line pt-7">
      <h2 className="text-sm font-medium">{labels.title}</h2>
      <div className="mt-4 space-y-3">
        <label className="block text-xs text-muted" htmlFor="admin-username">
          {labels.username}
          <input
            id="admin-username"
            {...register("username", {
              required: true,
              pattern: USERNAME_PATTERN,
              minLength: 3,
              maxLength: 64,
              setValueAs: (value) => (typeof value === "string" ? value.trim() : value),
            })}
            dir="ltr"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "admin-username-error" : undefined}
            disabled={!configured || formState.isSubmitting}
            className="mt-1.5 w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {errors.username && (
            <span id="admin-username-error" className="mt-1 block text-xs text-accent">
              {labels.errors.invalid_payload}
            </span>
          )}
        </label>
        <label className="block text-xs text-muted" htmlFor="admin-password">
          {labels.password}
          <input
            id="admin-password"
            {...register("password", {
              required: true,
              minLength: MIN_PASSWORD_LENGTH,
              maxLength: MAX_PASSWORD_LENGTH,
            })}
            type="password"
            dir="ltr"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "admin-password-error" : undefined}
            disabled={!configured || formState.isSubmitting}
            className="mt-1.5 w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
          />
          {errors.password && (
            <span id="admin-password-error" className="mt-1 block text-xs text-accent">
              {labels.errors.invalid_payload}
            </span>
          )}
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-accent/50 bg-accent-soft px-3 py-2 text-xs text-accent">
          {error}
        </p>
      )}
      {!configured && <p className="mt-3 text-xs leading-6 text-muted">{labels.setup}</p>}

      <button
        type="submit"
        disabled={!configured || formState.isSubmitting}
        className={`${primaryButtonClass} mt-4 w-full disabled:opacity-50`}
      >
        {formState.isSubmitting ? "…" : labels.button}
      </button>
    </form>
  );
}
