"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

const STORAGE_KEY = "rts-theme";

export function ThemeToggle({ label }: { label: string }) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the in-memory theme still works.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      <span className="theme-icon-light">
        <MoonIcon className="size-4" />
      </span>
      <span className="theme-icon-dark">
        <SunIcon className="size-4" />
      </span>
    </button>
  );
}
