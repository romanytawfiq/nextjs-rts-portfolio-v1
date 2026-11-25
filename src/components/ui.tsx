import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/components/icons";

export function SectionHeading({
  index,
  kicker,
  title,
}: {
  index: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.28em] text-accent">
        {index} / {kicker}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export function PendingBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-dashed border-accent/50 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

export function PendingLink({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
      {children}
    </span>
  );
}

export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-md text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent ${className}`}
    >
      {children}
      <ArrowUpRightIcon className="size-4" />
    </a>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs leading-5 text-muted">
      {children}
    </li>
  );
}
