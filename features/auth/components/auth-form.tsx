"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { usernameToEmail } from "@/lib/auth/username";
import { authSchema, type AuthInput } from "@/schemas/auth";
import { routes } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? routes.dashboard;
  const [mode, setMode] = useState<Mode>("signin");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthInput>({ resolver: zodResolver(authSchema) });

  async function onSubmit(values: AuthInput) {
    const supabase = createClient();
    const email = usernameToEmail(values.name);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: { data: { display_name: values.name.trim() } },
      });
      if (error) {
        return toast.error(
          /already registered/i.test(error.message)
            ? "That name is already taken — try another."
            : error.message,
        );
      }
      if (!data.session) {
        return toast.error("Couldn't sign you in. Try signing in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });
      if (error) {
        return toast.error(
          /invalid login credentials/i.test(error.message)
            ? "Wrong name or password."
            : error.message,
        );
      }
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="username"
          placeholder="e.g. alex"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
