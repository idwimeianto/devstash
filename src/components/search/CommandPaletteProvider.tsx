"use client";

import { createContext, use, useEffect, useMemo, useState } from "react";

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const context = use(CommandPaletteContext);
  if (!context) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return context;
}

interface CommandPaletteProviderProps {
  children: React.ReactNode;
}

// Holds the palette's open state, shared by the top bar trigger and the palette, and listens for Cmd/Ctrl+K.
export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen((current) => !current);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const context = useMemo(() => ({ open, setOpen }), [open]);

  return <CommandPaletteContext value={context}>{children}</CommandPaletteContext>;
}
