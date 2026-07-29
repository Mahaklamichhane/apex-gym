"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useExercises, useMuscleGroups } from "../hooks/use-exercises";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";

export function ExerciseList() {
  const { data: exercises, isPending, isError } = useExercises();
  const { data: muscles } = useMuscleGroups();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = search.trim().toLowerCase();
    return exercises.filter((ex) => {
      const matchesSearch = !q || ex.name.toLowerCase().includes(q);
      const matchesMuscle =
        !muscle ||
        [...ex.primaryMuscles, ...ex.secondaryMuscles].some(
          (m) => m.slug === muscle,
        );
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, muscle]);

  return (
    <div className="space-y-5">
      <Input
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {muscles && muscles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip active={muscle === null} onClick={() => setMuscle(null)}>
            All
          </FilterChip>
          {muscles.map((m) => (
            <FilterChip
              key={m.id}
              active={muscle === m.slug}
              onClick={() => setMuscle(muscle === m.slug ? null : m.slug)}
            >
              {m.name}
            </FilterChip>
          ))}
        </div>
      )}

      {isPending ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState description="Couldn't load exercises." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises found"
          description="Try a different search or filter."
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Link
                href={routes.exercise(ex.id)}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ex.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {ex.primaryMuscles.map((m) => m.name).join(", ") ||
                      "No muscles tagged"}
                  </p>
                </div>
                {ex.equipment && (
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {ex.equipment.name}
                  </Badge>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
