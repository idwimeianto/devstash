"use client";

import { createContext, use, type ReactNode } from "react";

const AiAccessContext = createContext<Promise<boolean> | null>(null);

interface AiAccessProviderProps {
  // Started on the server and not awaited, so the page doesn't wait for it.
  canUseAiPromise: Promise<boolean>;
  children: ReactNode;
}

export function AiAccessProvider({ canUseAiPromise, children }: AiAccessProviderProps) {
  return <AiAccessContext value={canUseAiPromise}>{children}</AiAccessContext>;
}

// Suspends until the server's answer arrives, so call it behind a <Suspense>.
export function useCanUseAi(): boolean {
  const promise = use(AiAccessContext);
  return promise ? use(promise) : false;
}
