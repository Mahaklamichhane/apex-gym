"use client";

import Link from "next/link";
import { Dumbbell, Flame, Trophy, TrendingUp, Plus, Weight } from "lucide-react";
import { useDashboard } from "../hooks/use-dashboard";
import { prTypeLabel } from "@/services/dashboard/queries";
import { routes } from "@/constants/routes";
import { formatDuration, formatRelativeDate, formatVolume } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states";

export function Dashboard() {
  const { data, isPending } = useDashboard();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            What should I do today?
          </h1>
        </div>
        <Link
          href={routes.workout}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" /> Start workout
        </Link>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={Dumbbell}
            label="Workouts"
            value={String(data?.totalWorkouts ?? 0)}
          />
          <Stat
            icon={Flame}
            label="Day streak"
            value={String(data?.streakDays ?? 0)}
          />
          <Stat
            icon={TrendingUp}
            label="Volume this week"
            value={data?.weeklyVolumeKg ? formatVolume(data.weeklyVolumeKg) : "—"}
          />
          <Stat
            icon={Weight}
            label="Bodyweight"
            value={data?.currentWeightKg ? `${data.currentWeightKg} kg` : "—"}
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent workouts</h2>
            <Link
              href={routes.history}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : data && data.recentSessions.length > 0 ? (
            <ul className="divide-y rounded-xl border">
              {data.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={routes.session(s.id)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {s.name ?? "Workout"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeDate(s.startedAt)} · {s.exerciseCount}{" "}
                        exercises
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-muted-foreground">
                      {s.totalVolumeKg ? formatVolume(s.totalVolumeKg) : ""}
                      {s.durationSeconds
                        ? ` · ${formatDuration(s.durationSeconds)}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No workouts yet"
              description="Start your first workout to see it here."
            />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Latest PRs</h2>
          {isPending ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : data && data.latestPRs.length > 0 ? (
            <ul className="divide-y rounded-xl border">
              {data.latestPRs.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pr.exerciseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {prTypeLabel(pr.prType)} ·{" "}
                        {formatRelativeDate(pr.achievedAt)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {pr.prType === "max_reps"
                      ? `${pr.value} reps`
                      : `${pr.value} kg`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No PRs yet"
              description="Finish a workout with completed sets to earn your first records."
            />
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Dumbbell;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 text-card-foreground">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
