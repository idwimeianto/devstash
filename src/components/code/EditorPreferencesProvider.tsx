"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

import type { EditorPreferences } from "@/types/editor-preferences";

interface EditorPreferencesContextValue {
  preferencesPromise: Promise<EditorPreferences>;
  // Set by the settings form, so a change shows at once without waiting for a refetch.
  current: EditorPreferences | null;
  setPreferences: (preferences: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

interface EditorPreferencesProviderProps {
  // Started on the server and not awaited, so the page doesn't wait for it.
  preferencesPromise: Promise<EditorPreferences>;
  children: ReactNode;
}

export function EditorPreferencesProvider({
  preferencesPromise,
  children,
}: EditorPreferencesProviderProps) {
  const [current, setPreferences] = useState<EditorPreferences | null>(null);
  const value = useMemo(
    () => ({ preferencesPromise, current, setPreferences }),
    [preferencesPromise, current],
  );

  return <EditorPreferencesContext value={value}>{children}</EditorPreferencesContext>;
}

// Suspends until the server's preferences arrive, so call it behind a <Suspense>.
export function useEditorPreferences() {
  const context = use(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  const preferences = context.current ?? use(context.preferencesPromise);
  return { preferences, setPreferences: context.setPreferences };
}
