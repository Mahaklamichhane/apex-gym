import type { Metadata } from "next";
import { Leaderboard } from "@/features/leaderboard/components/leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          See how you and your friends stack up. Only workouts of 30 minutes or
          more count.
        </p>
      </header>
      <Leaderboard />
    </div>
  );
}
