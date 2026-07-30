import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";
import { LogoMark } from "@/components/brand/logo";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      {/* Animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute -top-24 -left-24 size-96 rounded-full bg-[var(--brand)] opacity-20 blur-3xl" />
        <div
          className="animate-blob absolute -right-24 -bottom-24 size-96 rounded-full bg-[var(--brand-2)] opacity-20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <FadeIn className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-12" />
          <div className="space-y-1">
            <h1 className="text-gradient text-2xl font-semibold tracking-tight">
              Your training, tracked.
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in or create an account — just a name and password.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card/80 p-6 text-card-foreground shadow-xl shadow-black/5 backdrop-blur">
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Apex Gym · your personal fitness OS
        </p>
      </FadeIn>
    </main>
  );
}
