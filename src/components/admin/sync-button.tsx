"use client";

import axios from "axios";
import { useState } from "react";

import { ghostButtonClass } from "@/components/admin/ui";

export function SyncButton({
  label,
  busyLabel,
  repositoriesLabel,
  failedLabel,
}: {
  label: string;
  busyLabel: string;
  repositoriesLabel: string;
  failedLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sync() {
    setBusy(true);
    setMessage("");
    try {
      const { data } = await axios.post<{
        ok: boolean;
        synced: number;
        cached?: boolean;
        error?: string;
      }>("/api/admin/github/sync");
      setMessage(
        data.ok
          ? `${data.synced} ${repositoriesLabel}${data.cached ? " · cached" : ""}`
          : data.error ?? failedLabel,
      );
    } catch (error) {
      setMessage(
        axios.isAxiosError(error)
          ? `${error.response?.status ?? "network"} · ${failedLabel}`
          : failedLabel,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={sync} disabled={busy} className={ghostButtonClass}>
        {busy ? busyLabel : label}
      </button>
      {message && <p className="mt-3 break-words text-xs text-muted" dir="ltr">{message}</p>}
    </div>
  );
}
