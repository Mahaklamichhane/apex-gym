import type { SupabaseClient } from "@supabase/supabase-js";
import type { BodyMeasurement } from "@/types/domain";

export async function fetchWeightHistory(
  supabase: SupabaseClient,
): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from("body_measurements")
    .select("id, measured_at, weight_kg")
    .not("weight_kg", "is", null)
    .order("measured_at", { ascending: true });
  if (error) throw error;
  return (
    (data as Array<{ id: string; measured_at: string; weight_kg: number | null }>) ??
    []
  ).map((r) => ({
    id: r.id,
    measuredAt: r.measured_at,
    weightKg: r.weight_kg,
  }));
}

export async function logWeight(
  supabase: SupabaseClient,
  weightKg: number,
  measuredAt: string,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase.from("body_measurements").upsert(
    {
      user_id: user.id,
      measured_at: measuredAt,
      source: "manual",
      weight_kg: weightKg,
    },
    { onConflict: "user_id,measured_at,source" },
  );
  if (error) throw error;
}
