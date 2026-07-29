import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoggedSet } from "@/types/domain";

async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

/** Create a fresh empty session and return its id. */
export async function startEmptySession(
  supabase: SupabaseClient,
): Promise<string> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ user_id: userId, status: "active", name: "Workout" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Append an exercise to a session (position = current count). */
export async function addExerciseToSession(
  supabase: SupabaseClient,
  sessionId: string,
  exerciseId: string,
  position: number,
): Promise<void> {
  const { error } = await supabase.from("session_exercises").insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    position,
  });
  if (error) throw error;
}

export async function removeSessionExercise(
  supabase: SupabaseClient,
  sessionExerciseId: string,
): Promise<void> {
  const { error } = await supabase
    .from("session_exercises")
    .delete()
    .eq("id", sessionExerciseId);
  if (error) throw error;
}

/** Add an empty set row to a session-exercise. */
export async function addSet(
  supabase: SupabaseClient,
  sessionExerciseId: string,
  position: number,
): Promise<void> {
  const userId = await requireUserId(supabase);
  const { error } = await supabase.from("sets").insert({
    session_exercise_id: sessionExerciseId,
    user_id: userId,
    position,
    set_type: "normal",
    is_completed: false,
  });
  if (error) throw error;
}

export async function updateSet(
  supabase: SupabaseClient,
  setId: string,
  patch: Partial<
    Pick<LoggedSet, "weightKg" | "reps" | "rpe" | "isCompleted" | "setType">
  > & { completedAt?: string | null },
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if ("weightKg" in patch) dbPatch.weight_kg = patch.weightKg;
  if ("reps" in patch) dbPatch.reps = patch.reps;
  if ("rpe" in patch) dbPatch.rpe = patch.rpe;
  if ("setType" in patch) dbPatch.set_type = patch.setType;
  if ("isCompleted" in patch) {
    dbPatch.is_completed = patch.isCompleted;
    dbPatch.completed_at = patch.isCompleted ? new Date().toISOString() : null;
  }
  const { error } = await supabase.from("sets").update(dbPatch).eq("id", setId);
  if (error) throw error;
}

export async function deleteSet(
  supabase: SupabaseClient,
  setId: string,
): Promise<void> {
  const { error } = await supabase.from("sets").delete().eq("id", setId);
  if (error) throw error;
}

/** Mark the session complete — DB triggers compute volume/duration + PRs. */
export async function finishSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function abandonSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}
