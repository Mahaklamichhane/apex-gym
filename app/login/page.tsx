import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 text-card-foreground">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to Apex Gym to continue.
          </p>
        </div>

        {/* TODO(Phase 0): real Supabase Auth form (email + OAuth). Placeholder for now. */}
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Auth form coming next.
        </div>
      </div>
    </main>
  );
}
