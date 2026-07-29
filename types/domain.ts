/**
 * Hand-written domain types — the shapes the UI works with (camelCase, composed).
 * These sit on top of the generated `database.ts` row types; services map raw
 * snake_case rows into these. Keep them the single vocabulary for the app.
 */
export type Region = "upper" | "core" | "lower";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface MuscleGroup {
  id: string;
  slug: string;
  name: string;
  region: Region;
}

export interface Equipment {
  id: string;
  slug: string;
  name: string;
}

export interface Exercise {
  id: string;
  ownerId: string | null; // null = global/system exercise
  name: string;
  description: string | null;
  instructions: string | null;
  difficulty: Difficulty;
  isUnilateral: boolean;
  videoUrl: string | null;
  gifUrl: string | null;
  tips: string[];
  commonMistakes: string[];
  tags: string[];
  equipment: Equipment | null;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}
