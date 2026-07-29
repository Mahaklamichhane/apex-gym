"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";
import { createClient } from "@/services/supabase/client";
import { fetchProfile, updateProfile } from "@/services/profile/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function Settings() {
  return (
    <div className="space-y-8">
      <ThemeSection />
      <ProfileSection />
    </div>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();
  // Avoid a hydration mismatch: theme is only known on the client.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Appearance</h2>
      <div className="flex gap-2">
        {options.map((o) => {
          const Icon = o.icon;
          const active = mounted && theme === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                active ? "border-primary bg-accent" : "hover:bg-accent/50",
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm">{o.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProfileSection() {
  const qc = useQueryClient();
  const { data: profile, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(createClient()),
  });

  const [name, setName] = useState("");
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [water, setWater] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Seed form once when the profile arrives.
  if (profile && !loaded) {
    setLoaded(true);
    setName(profile.displayName ?? "");
    setUnits(profile.unitSystem);
    setCalories(profile.targetCalories?.toString() ?? "");
    setProtein(profile.proteinGoalG?.toString() ?? "");
    setWater(profile.waterGoalMl?.toString() ?? "");
  }

  const save = useMutation({
    mutationFn: () =>
      updateProfile(createClient(), {
        displayName: name || null,
        unitSystem: units,
        targetCalories: calories ? Number(calories) : null,
        proteinGoalG: protein ? Number(protein) : null,
        waterGoalMl: water ? Number(water) : null,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Couldn't save settings"),
  });

  if (isPending) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <section className="space-y-4">
      <h2 className="font-medium">Profile & goals</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4 rounded-xl border p-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Units</Label>
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnits(u)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                  units === u ? "border-primary bg-accent" : "hover:bg-accent/50",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cal">Calories</Label>
            <Input
              id="cal"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pro">Protein (g)</Label>
            <Input
              id="pro"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wat">Water (ml)</Label>
            <Input
              id="wat"
              inputMode="numeric"
              value={water}
              onChange={(e) => setWater(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={save.isPending}>
          Save
        </Button>
      </form>
    </section>
  );
}
