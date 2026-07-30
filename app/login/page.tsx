import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="bg-hero-glow flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Apex Gym
          </p>
          <h1 className="text-gradient text-2xl font-semibold tracking-tight">
            Your training, tracked.
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account — just a name and password.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
