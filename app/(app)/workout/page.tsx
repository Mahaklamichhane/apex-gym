import type { Metadata } from "next";
import { StartWorkout } from "@/features/workout-session/components/start-workout";

export const metadata: Metadata = { title: "Workout" };

export default function WorkoutPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Workout</h1>
        <p className="text-sm text-muted-foreground">
          Start a session and log your sets as you train.
        </p>
      </header>
      <StartWorkout />
    </div>
  );
}
