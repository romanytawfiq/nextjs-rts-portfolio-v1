import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent";

export function AdminPageHeader({
  title,
  subtitle,
  notice,
}: {
  title: string;
  subtitle: string;
  notice: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
      <p className="mt-4 rounded-lg border border-dashed border-accent/50 bg-accent-soft px-4 py-3 text-xs text-accent">
        {notice}
      </p>
    </div>
  );
}

export function AdminCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "muted";
  children: ReactNode;
}) {
  const tones = {
    ok: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    warn: "border-accent/50 bg-accent-soft text-accent",
    muted: "border-line bg-surface-muted text-muted",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-background px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-4 py-3 text-start font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
