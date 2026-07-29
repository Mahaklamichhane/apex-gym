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

export type SetType =
  | "normal"
  | "warmup"
  | "drop"
  | "failure"
  | "partial"
  | "paused";
export type SessionStatus = "active" | "completed" | "abandoned";

export interface LoggedSet {
  id: string;
  sessionExerciseId: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  setType: SetType;
  isCompleted: boolean;
  notes: string | null;
}

export interface SessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
  notes: string | null;
  exercise: Pick<Exercise, "id" | "name"> & {
    primaryMuscles: MuscleGroup[];
  };
  sets: LoggedSet[];
}

export interface SessionSummary {
  id: string;
  name: string | null;
  startedAt: string;
  durationSeconds: number | null;
  totalVolumeKg: number | null;
  exerciseCount: number;
}

export interface PRSummary {
  id: string;
  exerciseName: string;
  prType: string;
  value: number;
  achievedAt: string;
}

export interface DashboardData {
  totalWorkouts: number;
  weeklyVolumeKg: number;
  streakDays: number;
  currentWeightKg: number | null;
  recentSessions: SessionSummary[];
  latestPRs: PRSummary[];
}

export interface BodyMeasurement {
  id: string;
  measuredAt: string;
  weightKg: number | null;
}

export interface WorkoutSession {
  id: string;
  name: string | null;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  totalVolumeKg: number | null;
  notes: string | null;
  exercises: SessionExercise[];
}
