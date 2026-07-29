"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { fetchRecentSessions } from "@/services/dashboard/queries";
import { routes } from "@/constants/routes";
import { formatDuration, formatRelativeDate, formatVolume } from "@/utils/format";
import { EmptyState, ListSkeleton } from "@/components/states";

export function HistoryList() {
  const { data, isPending } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchRecentSessions(createClient(), 100),
    staleTime: 30 * 1000,
  });

  if (isPending) return <ListSkeleton />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        icon={Dumbbell}
        title="No workouts yet"
        description="Once you finish workouts, they'll show up here."
      />
    );

  return (
    <ul className="divide-y rounded-xl border">
      {data.map((s) => (
        <li key={s.id}>
          <Link
            href={routes.session(s.id)}
            className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-accent/50"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{s.name ?? "Workout"}</p>
              <p className="text-sm text-muted-foreground">
                {formatRelativeDate(s.startedAt)} · {s.exerciseCount} exercises
              </p>
            </div>
            <p className="shrink-0 text-right text-sm text-muted-foreground">
              {s.totalVolumeKg ? formatVolume(s.totalVolumeKg) : "—"}
              {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ""}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
