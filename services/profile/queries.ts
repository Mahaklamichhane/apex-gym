import type { SupabaseClient } from "@supabase/supabase-js";

export interface Profile {
  displayName: string | null;
  unitSystem: "metric" | "imperial";
  targetCalories: number | null;
  proteinGoalG: number | null;
  waterGoalMl: number | null;
}

export async function fetchProfile(
  supabase: SupabaseClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, unit_system, target_calories, protein_goal_g, water_goal_ml")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as {
    display_name: string | null;
    unit_system: "metric" | "imperial";
    target_calories: number | null;
    protein_goal_g: number | null;
    water_goal_ml: number | null;
  };
  return {
    displayName: r.display_name,
    unitSystem: r.unit_system,
    targetCalories: r.target_calories,
    proteinGoalG: r.protein_goal_g,
    waterGoalMl: r.water_goal_ml,
  };
}

export async function updateProfile(
  supabase: SupabaseClient,
  patch: Partial<Profile>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const dbPatch: Record<string, unknown> = {};
  if ("displayName" in patch) dbPatch.display_name = patch.displayName;
  if ("unitSystem" in patch) dbPatch.unit_system = patch.unitSystem;
  if ("targetCalories" in patch) dbPatch.target_calories = patch.targetCalories;
  if ("proteinGoalG" in patch) dbPatch.protein_goal_g = patch.proteinGoalG;
  if ("waterGoalMl" in patch) dbPatch.water_goal_ml = patch.waterGoalMl;
  const { error } = await supabase
    .from("profiles")
    .update(dbPatch)
    .eq("id", user.id);
  if (error) throw error;
}
