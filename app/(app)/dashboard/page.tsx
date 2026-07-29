import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          What should I do today?
        </h1>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {["Today's workout", "Streak", "Bodyweight", "Recovery", "Protein", "Water"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-5 text-card-foreground"
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">—</p>
            </div>
          ),
        )}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Widgets fill in as we build each feature (see docs/03-wireframes.md).
      </p>
    </main>
  );
}
