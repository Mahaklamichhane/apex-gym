"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dumbbell, Loader2, Plus } from "lucide-react";
import { useSession, useSessionMutations } from "../hooks/use-workout";
import { SetRow } from "./set-row";
import { AddExerciseDialog } from "./add-exercise-dialog";
import { routes } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function Elapsed({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setNow(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="tabular-nums">{now === null ? "0:00" : formatDuration(now)}</span>
  );
}

export function WorkoutMode({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, isPending, isError } = useSession(id);
  const mut = useSessionMutations(id);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (isError) return <ErrorState description="Couldn't load this workout." />;
  if (!session)
    return (
      <EmptyState
        title="Workout not found"
        description="It may have been finished or removed."
      />
    );

  if (session.status === "completed") {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Workout complete 💪
        </h1>
        <p className="text-muted-foreground">
          {session.totalVolumeKg
            ? `${Math.round(session.totalVolumeKg).toLocaleString()} kg total volume`
            : "Nice work."}
          {session.durationSeconds
            ? ` · ${formatDuration(session.durationSeconds)}`
            : ""}
        </p>
        <Button onClick={() => router.push(routes.dashboard)}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  async function finish() {
    if (!confirm("Finish this workout?")) return;
    try {
      await mut.finish.mutateAsync();
      toast.success("Workout saved!");
      router.push(routes.dashboard);
      router.refresh();
    } catch {
      toast.error("Couldn't finish the workout.");
    }
  }

  const completedSets = session.exercises.reduce(
    (n, se) => n + se.sets.filter((s) => s.isCompleted).length,
    0,
  );

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Elapsed startedAt={session.startedAt} /> · {completedSets} sets done
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {session.name ?? "Workout"}
          </h1>
        </div>
        <Button onClick={finish} disabled={mut.finish.isPending}>
          {mut.finish.isPending && <Loader2 className="size-4 animate-spin" />}
          Finish
        </Button>
      </header>

      {session.exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises yet"
          description="Add your first exercise to start logging sets."
        />
      ) : (
        <div className="space-y-4">
          {session.exercises.map((se) => (
            <section key={se.id} className="rounded-xl border p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{se.exercise.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {se.exercise.primaryMuscles.map((mm) => mm.name).join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => mut.removeExercise.mutate(se.id)}
                  className="text-sm text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>

              {se.sets.length > 0 && (
                <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_auto_auto] gap-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <span className="text-center">#</span>
                  <span className="text-center">kg</span>
                  <span className="text-center">reps</span>
                  <span className="text-center">✓</span>
                  <span />
                </div>
              )}

              <div className="space-y-1">
                {se.sets.map((set, i) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    index={i}
                    onSave={(patch) =>
                      mut.updateSet.mutate({ setId: set.id, patch })
                    }
                    onToggle={(completed) =>
                      mut.updateSet.mutate({
                        setId: set.id,
                        patch: { isCompleted: completed },
                      })
                    }
                    onDelete={() => mut.deleteSet.mutate(set.id)}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  mut.addSet.mutate({
                    sessionExerciseId: se.id,
                    position: se.sets.length,
                  })
                }
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className="size-4" /> Add set
              </button>
            </section>
          ))}
        </div>
      )}

      <AddExerciseDialog
        pending={mut.addExercise.isPending}
        onAdd={(exerciseId) =>
          mut.addExercise.mutate({
            exerciseId,
            position: session.exercises.length,
          })
        }
      />
    </div>
  );
}
