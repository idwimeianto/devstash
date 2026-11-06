"use client";

import { createContext, Suspense, use, type ReactNode } from "react";

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

function AiOnlyForPlan({ children }: { children: ReactNode }) {
  return useCanUseAi() ? children : null;
}

// Hidden until the plan is known, so free users never see an AI control appear and vanish.
export function AiOnly({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AiOnlyForPlan>{children}</AiOnlyForPlan>
    </Suspense>
  );
}
