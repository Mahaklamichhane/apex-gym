"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Users } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { fetchLeaderboard } from "@/services/leaderboard/queries";
import { formatVolume } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState, ListSkeleton } from "@/components/states";
import { Stagger, StaggerItem } from "@/components/motion";

type Metric = "streak" | "workouts" | "weeklyVolume";

const METRICS: { key: Metric; label: string }[] = [
  { key: "streak", label: "Streak" },
  { key: "workouts", label: "Workouts" },
  { key: "weeklyVolume", label: "Volume (7d)" },
];

export function Leaderboard() {
  const [metric, setMetric] = useState<Metric>("streak");

  const { data: rows, isPending } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLeaderboard(createClient()),
    staleTime: 60 * 1000,
  });

  const { data: meId } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      return user?.id ?? null;
    },
    staleTime: Infinity,
  });

  const ranked = useMemo(() => {
    return [...(rows ?? [])].sort((a, b) => b[metric] - a[metric]);
  }, [rows, metric]);

  if (isPending) return <ListSkeleton rows={5} />;
  if (ranked.length === 0)
    return (
      <EmptyState
        icon={Users}
        title="No one on the board yet"
        description="Complete a 30-minute workout to show up here."
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              metric === m.key
                ? "border-transparent bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Stagger className="space-y-2">
        {ranked.map((row, i) => {
          const isMe = row.userId === meId;
          return (
            <StaggerItem key={row.userId}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                  isMe && "border-primary/40 bg-primary/5",
                )}
              >
                <Rank index={i} />
                <Avatar className="size-9">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-medium",
                      isMe && "bg-primary/15 text-primary",
                    )}
                  >
                    {row.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {row.displayName}
                    {isMe && (
                      <span className="ml-2 text-xs text-primary">You</span>
                    )}
                  </p>
                  <p className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Flame className="size-3.5 text-amber-500" />
                      {row.streak}
                    </span>
                    <span>{row.workouts} workouts</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {metric === "streak"
                      ? `${row.streak}🔥`
                      : metric === "workouts"
                        ? row.workouts
                        : row.weeklyVolume
                          ? formatVolume(row.weeklyVolume)
                          : "—"}
                  </p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}

function Rank({ index }: { index: number }) {
  const medals = ["text-amber-400", "text-zinc-300", "text-amber-700"];
  if (index < 3) {
    return (
      <span className="flex w-6 justify-center">
        <Trophy className={cn("size-5", medals[index])} />
      </span>
    );
  }
  return (
    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
      {index + 1}
    </span>
  );
}
