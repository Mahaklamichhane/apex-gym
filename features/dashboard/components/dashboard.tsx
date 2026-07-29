"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Dumbbell, Flame, Trophy, TrendingUp, Plus, Weight } from "lucide-react";
import { useDashboard } from "../hooks/use-dashboard";
import { prTypeLabel } from "@/services/dashboard/queries";
import { routes } from "@/constants/routes";
import { formatDuration, formatRelativeDate, formatVolume } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/states";
import { FadeIn, Stagger, StaggerItem, Tappable } from "@/components/motion";
import { CountUp } from "@/components/motion/count-up";

export function Dashboard() {
  const { data, isPending } = useDashboard();

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <FadeIn className="bg-hero-glow -mx-6 -mt-10 rounded-b-3xl px-6 pt-10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Dashboard
            </p>
            <h1 className="text-gradient text-3xl font-semibold tracking-tight">
              What should I do today?
            </h1>
          </div>
          <Tappable>
            <Link
              href={routes.workout}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow hover:shadow-primary/30"
            >
              <Plus className="size-4" /> Start workout
            </Link>
          </Tappable>
        </div>
      </FadeIn>

      {/* Stats */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Dumbbell}
            tint="text-primary"
            label="Workouts"
            value={<CountUp value={data?.totalWorkouts ?? 0} />}
          />
          <StatTile
            icon={Flame}
            tint="text-amber-500"
            label="Day streak"
            value={<CountUp value={data?.streakDays ?? 0} />}
          />
          <StatTile
            icon={TrendingUp}
            tint="text-emerald-400"
            label="Volume this week"
            value={
              data?.weeklyVolumeKg ? (
                <CountUp value={data.weeklyVolumeKg} format={formatVolume} />
              ) : (
                "—"
              )
            }
          />
          <StatTile
            icon={Weight}
            tint="text-sky-400"
            label="Bodyweight"
            value={data?.currentWeightKg ? `${data.currentWeightKg} kg` : "—"}
          />
        </Stagger>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent workouts */}
        <FadeIn delay={0.05} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent workouts</h2>
            <Link
              href={routes.history}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : data && data.recentSessions.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border">
              {data.recentSessions.map((s) => (
                <li key={s.id} className="border-b last:border-0">
                  <Link
                    href={routes.session(s.id)}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
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
        </FadeIn>

        {/* Latest PRs */}
        <FadeIn delay={0.1} className="space-y-3">
          <h2 className="font-medium">Latest PRs</h2>
          {isPending ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : data && data.latestPRs.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border">
              {data.latestPRs.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-amber-500/10">
                      <Trophy className="size-4 text-amber-500" />
                    </span>
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
        </FadeIn>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <StaggerItem>
      <div className="group rounded-2xl border bg-card p-5 text-card-foreground transition-colors hover:border-primary/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg bg-foreground/5",
              tint,
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="text-sm">{label}</span>
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </StaggerItem>
  );
}
