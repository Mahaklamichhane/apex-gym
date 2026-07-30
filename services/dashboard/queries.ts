import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardData,
  PRSummary,
  SessionSummary,
} from "@/types/domain";
import { MIN_WORKOUT_SECONDS } from "@/constants/workout";

const PR_TYPE_LABEL: Record<string, string> = {
  max_weight: "Heaviest",
  est_1rm: "Est. 1RM",
  max_reps: "Most reps",
  max_volume: "Volume",
  longest_set: "Longest set",
};

export function prTypeLabel(t: string) {
  return PR_TYPE_LABEL[t] ?? t;
}

interface RawSessionSummary {
  id: string;
  name: string | null;
  started_at: string;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  session_exercises: { count: number }[];
}

export async function fetchRecentSessions(
  supabase: SupabaseClient,
  limit = 50,
): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, name, started_at, duration_seconds, total_volume_kg, session_exercises(count)",
    )
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as RawSessionSummary[]).map((r) => ({
    id: r.id,
    name: r.name,
    startedAt: r.started_at,
    durationSeconds: r.duration_seconds,
    totalVolumeKg: r.total_volume_kg,
    exerciseCount: r.session_exercises?.[0]?.count ?? 0,
  }));
}

/** Consecutive-day streak counting today or yesterday as the anchor. */
function computeStreak(dates: string[]): number {
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  if (days.size === 0) return 0;
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const cursor = new Date(today);
  if (!days.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(iso(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export async function fetchDashboard(
  supabase: SupabaseClient,
): Promise<DashboardData> {
  const recentSessions = await fetchRecentSessions(supabase, 60);

  // Only sessions >= 30 min count toward stats (streak, count, volume).
  const qualifying = recentSessions.filter(
    (s) => (s.durationSeconds ?? 0) >= MIN_WORKOUT_SECONDS,
  );

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyVolumeKg = qualifying
    .filter((s) => new Date(s.startedAt).getTime() >= weekAgo)
    .reduce((sum, s) => sum + (s.totalVolumeKg ?? 0), 0);

  const streakDays = computeStreak(qualifying.map((s) => s.startedAt));

  const { data: prRows } = await supabase
    .from("personal_records")
    .select("id, pr_type, value, achieved_at, exercises(name)")
    .order("achieved_at", { ascending: false })
    .limit(5);

  const latestPRs: PRSummary[] = (
    (prRows as unknown as Array<{
      id: string;
      pr_type: string;
      value: number;
      achieved_at: string;
      exercises: { name: string } | null;
    }>) ?? []
  ).map((r) => ({
    id: r.id,
    exerciseName: r.exercises?.name ?? "Exercise",
    prType: r.pr_type,
    value: r.value,
    achievedAt: r.achieved_at,
  }));

  const { data: weightRow } = await supabase
    .from("body_measurements")
    .select("weight_kg")
    .not("weight_kg", "is", null)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    totalWorkouts: qualifying.length,
    weeklyVolumeKg,
    streakDays,
    currentWeightKg: (weightRow as { weight_kg: number } | null)?.weight_kg ?? null,
    recentSessions: recentSessions.slice(0, 6),
    latestPRs,
  };
}
