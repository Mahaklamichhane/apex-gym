"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dumbbell, Loader2, Plus, Trophy } from "lucide-react";
import { useSession, useSessionMutations } from "../hooks/use-workout";
import { SetRow } from "./set-row";
import { AddExerciseDialog } from "./add-exercise-dialog";
import { createClient } from "@/services/supabase/client";
import { fetchSessionPRs } from "@/services/workouts/queries";
import { prTypeLabel } from "@/services/dashboard/queries";
import { routes } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { Confetti } from "@/components/motion/confetti";

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
    const tick = () =>
      setNow(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="tabular-nums">
      {now === null ? "0:00" : formatDuration(now)}
    </span>
  );
}

export function WorkoutMode({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, isPending, isError } = useSession(id);
  const mut = useSessionMutations(id);
  const [celebrate, setCelebrate] = useState(false);

  const isCompleted = session?.status === "completed";
  const { data: prs } = useQuery({
    queryKey: ["session-prs", id],
    queryFn: () => fetchSessionPRs(createClient(), id),
    enabled: isCompleted,
    staleTime: Infinity,
  });

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
      <FadeIn className="space-y-6">
        {celebrate && <Confetti />}

        <div className="space-y-2 text-center">
          {celebrate && <p className="text-4xl">🎉</p>}
          <h1 className="text-2xl font-semibold tracking-tight">
            {celebrate ? "Workout complete!" : (session.name ?? "Workout")}
          </h1>
          <p className="text-muted-foreground">
            {new Date(session.startedAt).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
            {session.totalVolumeKg
              ? ` · ${Math.round(session.totalVolumeKg).toLocaleString()} kg`
              : ""}
            {session.durationSeconds
              ? ` · ${formatDuration(session.durationSeconds)}`
              : ""}
          </p>
        </div>

        {prs && prs.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="flex items-center gap-2 font-medium text-amber-500">
              <Trophy className="size-4" /> New personal records!
            </p>
            <ul className="space-y-1 text-sm">
              {prs.map((pr) => (
                <li key={pr.id} className="flex justify-between">
                  <span>
                    {pr.exerciseName} · {prTypeLabel(pr.prType)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {pr.prType === "max_reps"
                      ? `${pr.value} reps`
                      : `${pr.value} kg`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {session.exercises.map((se) => (
            <section key={se.id} className="rounded-xl border p-4">
              <h2 className="mb-2 font-medium">{se.exercise.name}</h2>
              <div className="space-y-1 text-sm">
                {se.sets.map((set, i) => (
                  <div
                    key={set.id}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <span className="w-6 text-center">{i + 1}</span>
                    <span className="text-foreground">
                      {set.weightKg ?? "—"} kg × {set.reps ?? "—"}
                    </span>
                    {set.isCompleted && <span className="text-xs">✓</span>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Button className="w-full" onClick={() => router.push(routes.dashboard)}>
          Done
        </Button>
      </FadeIn>
    );
  }

  async function finish() {
    if (!confirm("Finish this workout?")) return;
    try {
      await mut.finish.mutateAsync();
      setCelebrate(true);
      toast.success("Workout saved!");
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
        <Stagger className="space-y-4">
          {session.exercises.map((se) => (
            <StaggerItem key={se.id}>
              <section className="rounded-xl border p-4">
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
            </StaggerItem>
          ))}
        </Stagger>
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
