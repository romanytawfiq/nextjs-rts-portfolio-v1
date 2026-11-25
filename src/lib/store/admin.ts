"use client";

import { create } from "zustand";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type SaveState = {
  status: SaveStatus;
  message: string;
  begin: () => void;
  success: () => void;
  failure: (message: string) => void;
  reset: () => void;
};

export const useContentSave = create<SaveState>((set) => ({
  status: "idle",
  message: "",
  begin: () => set({ status: "saving", message: "" }),
  success: () => set({ status: "saved", message: "" }),
  failure: (message) => set({ status: "error", message }),
  reset: () => set({ status: "idle", message: "" }),
}));
