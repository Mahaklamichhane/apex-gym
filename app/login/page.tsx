import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Apex Gym
          </p>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to continue to your training.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
