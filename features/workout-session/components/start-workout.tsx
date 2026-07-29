"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dumbbell, Loader2, Play } from "lucide-react";
import { useActiveSession, useStartWorkout } from "../hooks/use-workout";
import { routes } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function StartWorkout() {
  const router = useRouter();
  const { data: active, isPending } = useActiveSession();
  const start = useStartWorkout();

  async function begin() {
    try {
      const id = await start.mutateAsync();
      router.push(routes.session(id));
    } catch {
      toast.error("Couldn't start the workout.");
    }
  }

  if (isPending) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      {active && (
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
          <div>
            <p className="text-sm text-muted-foreground">In progress</p>
            <p className="font-medium">{active.name ?? "Workout"}</p>
            <p className="text-sm text-muted-foreground">
              {active.exercises.length} exercises
            </p>
          </div>
          <Button onClick={() => router.push(routes.session(active.id))}>
            <Play className="size-4" /> Resume
          </Button>
        </div>
      )}

      <button
        onClick={begin}
        disabled={start.isPending}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center transition-colors hover:bg-accent disabled:opacity-60"
      >
        {start.isPending ? (
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        ) : (
          <Dumbbell className="size-8 text-muted-foreground" />
        )}
        <span className="font-medium">Start an empty workout</span>
        <span className="max-w-xs text-sm text-muted-foreground">
          Add exercises as you go and log each set. You can finish whenever
          you&apos;re done.
        </span>
      </button>
    </div>
  );
}
