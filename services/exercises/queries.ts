import type { SupabaseClient } from "@supabase/supabase-js";
import type { Exercise, MuscleGroup } from "@/types/domain";

/**
 * Exercise data access. Pure functions that take a Supabase client (browser or
 * server) so they work in both Client Components and Server Components.
 */

const EXERCISE_SELECT = `
  id, owner_id, name, description, instructions, difficulty, is_unilateral,
  video_url, gif_url, tips, common_mistakes, tags,
  equipment:equipment_id ( id, slug, name ),
  exercise_muscles ( is_primary, muscle_groups ( id, slug, name, region ) )
`;

// The raw embedded-row shape PostgREST returns for the select above.
interface RawExerciseRow {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  difficulty: Exercise["difficulty"];
  is_unilateral: boolean;
  video_url: string | null;
  gif_url: string | null;
  tips: string[] | null;
  common_mistakes: string[] | null;
  tags: string[] | null;
  equipment: { id: string; slug: string; name: string } | null;
  exercise_muscles: Array<{
    is_primary: boolean;
    muscle_groups: MuscleGroup | null;
  }>;
}

function mapExercise(row: RawExerciseRow): Exercise {
  const primary: MuscleGroup[] = [];
  const secondary: MuscleGroup[] = [];
  for (const em of row.exercise_muscles ?? []) {
    if (!em.muscle_groups) continue;
    (em.is_primary ? primary : secondary).push(em.muscle_groups);
  }
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    difficulty: row.difficulty,
    isUnilateral: row.is_unilateral,
    videoUrl: row.video_url,
    gifUrl: row.gif_url,
    tips: row.tips ?? [],
    commonMistakes: row.common_mistakes ?? [],
    tags: row.tags ?? [],
    equipment: row.equipment,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
  };
}

export async function fetchExercises(
  supabase: SupabaseClient,
): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select(EXERCISE_SELECT)
    .order("name");
  if (error) throw error;
  return (data as unknown as RawExerciseRow[]).map(mapExercise);
}

export async function fetchExerciseById(
  supabase: SupabaseClient,
  id: string,
): Promise<Exercise | null> {
  const { data, error } = await supabase
    .from("exercises")
    .select(EXERCISE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapExercise(data as unknown as RawExerciseRow) : null;
}

export async function fetchMuscleGroups(
  supabase: SupabaseClient,
): Promise<MuscleGroup[]> {
  const { data, error } = await supabase
    .from("muscle_groups")
    .select("id, slug, name, region")
    .order("name");
  if (error) throw error;
  return (data as MuscleGroup[]) ?? [];
}
