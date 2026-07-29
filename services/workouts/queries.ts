import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LoggedSet,
  MuscleGroup,
  SessionExercise,
  WorkoutSession,
} from "@/types/domain";

const SESSION_SELECT = `
  id, name, status, started_at, ended_at, duration_seconds, total_volume_kg, notes,
  session_exercises (
    id, session_id, exercise_id, position, notes,
    exercise:exercise_id (
      id, name,
      exercise_muscles ( is_primary, muscle_groups ( id, slug, name, region ) )
    ),
    sets ( id, session_exercise_id, position, weight_kg, reps, rpe, set_type, is_completed, notes )
  )
`;

interface RawSet {
  id: string;
  session_exercise_id: string;
  position: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  set_type: LoggedSet["setType"];
  is_completed: boolean;
  notes: string | null;
}

interface RawSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    exercise_muscles: Array<{
      is_primary: boolean;
      muscle_groups: MuscleGroup | null;
    }>;
  } | null;
  sets: RawSet[];
}

interface RawSession {
  id: string;
  name: string | null;
  status: WorkoutSession["status"];
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  total_volume_kg: number | null;
  notes: string | null;
  session_exercises: RawSessionExercise[];
}

function mapSet(r: RawSet): LoggedSet {
  return {
    id: r.id,
    sessionExerciseId: r.session_exercise_id,
    position: r.position,
    weightKg: r.weight_kg,
    reps: r.reps,
    rpe: r.rpe,
    setType: r.set_type,
    isCompleted: r.is_completed,
    notes: r.notes,
  };
}

function mapSessionExercise(r: RawSessionExercise): SessionExercise {
  const primary =
    r.exercise?.exercise_muscles
      ?.filter((em) => em.is_primary && em.muscle_groups)
      .map((em) => em.muscle_groups as MuscleGroup) ?? [];
  return {
    id: r.id,
    sessionId: r.session_id,
    exerciseId: r.exercise_id,
    position: r.position,
    notes: r.notes,
    exercise: {
      id: r.exercise?.id ?? r.exercise_id,
      name: r.exercise?.name ?? "Unknown exercise",
      primaryMuscles: primary,
    },
    sets: [...(r.sets ?? [])].sort((a, b) => a.position - b.position).map(mapSet),
  };
}

function mapSession(r: RawSession): WorkoutSession {
  return {
    id: r.id,
    name: r.name,
    status: r.status,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationSeconds: r.duration_seconds,
    totalVolumeKg: r.total_volume_kg,
    notes: r.notes,
    exercises: [...(r.session_exercises ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(mapSessionExercise),
  };
}

/** The currently-active (in-progress) session, if any. */
export async function fetchActiveSession(
  supabase: SupabaseClient,
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data as unknown as RawSession) : null;
}

export async function fetchSession(
  supabase: SupabaseClient,
  id: string,
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data as unknown as RawSession) : null;
}
