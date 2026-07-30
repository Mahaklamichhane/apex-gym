"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * App error boundary. A common cause of runtime errors here is a stale tab after
 * a new deploy — the browser tries to load a code chunk that no longer exists
 * ("Load failed" / ChunkLoadError). We auto-reload once to pick up the current
 * version; otherwise show a friendly retry.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    const isStaleChunk =
      /chunk|load failed|failed to fetch|dynamically imported|importing a module/i.test(
        msg,
      );
    if (isStaleChunk && !sessionStorage.getItem("apex-auto-reloaded")) {
      sessionStorage.setItem("apex-auto-reloaded", "1");
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            This usually clears with a refresh.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => reset()}>
            Try again
          </Button>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    </div>
  );
}
