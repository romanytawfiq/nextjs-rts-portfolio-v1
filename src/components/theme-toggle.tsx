"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { MoonIcon, SunIcon } from "@/components/icons";

const STORAGE_KEY = "rts-theme";

function readStoredTheme(): "light" | "dark" | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

// useLayoutEffect runs before paint on client navigations; fall back to
// useEffect during server rendering to avoid the server-only warning.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// A locale switch remounts the document shell. Re-apply the stored theme on
// every pathname change so EN/AR navigation never falls back to light.
export function ThemeSync() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    const stored = readStoredTheme();
    if (stored) document.documentElement.dataset.theme = stored;
  }, [pathname]);

  return null;
}

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
      className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-foreground transition-colors hover:border-accent hover:text-accent"
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
