import type { Metadata } from "next";
import { ExerciseList } from "@/features/exercises/components/exercise-list";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <p className="text-sm text-muted-foreground">
          Your library of movements. Search, filter by muscle, and open one for
          instructions and history.
        </p>
      </header>
      <ExerciseList />
    </div>
  );
}
