"use client";

import { Button } from "@/components/ui/button";

interface AppErrorProps {
  error: unknown;
  retry: () => void;
}

export default function AppError({ retry }: AppErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4">
      <div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-1 text-muted-foreground">
          We couldn&apos;t load this page. Please try again.
        </p>
      </div>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
