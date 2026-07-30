import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeaderboardRow {
  userId: string;
  displayName: string;
  workouts: number;
  streak: number;
  weeklyVolume: number;
}

export async function fetchLeaderboard(
  supabase: SupabaseClient,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) throw error;
  return (
    (data as Array<{
      user_id: string;
      display_name: string;
      workouts: number;
      streak: number;
      weekly_volume: number;
    }>) ?? []
  ).map((r) => ({
    userId: r.user_id,
    displayName: r.display_name,
    workouts: r.workouts,
    streak: r.streak,
    weeklyVolume: Number(r.weekly_volume),
  }));
}
