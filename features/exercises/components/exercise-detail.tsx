"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useExercise } from "../hooks/use-exercises";
import { routes } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/states";
import { FadeIn } from "@/components/motion";

export function ExerciseDetail({ id }: { id: string }) {
  const { data: ex, isPending, isError } = useExercise(id);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  if (isError) return <ErrorState description="Couldn't load this exercise." />;
  if (!ex)
    return (
      <EmptyState title="Exercise not found" description="It may have been deleted." />
    );

  return (
    <FadeIn className="space-y-6">
      <Link
        href={routes.exercises}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Exercises
      </Link>

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{ex.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {ex.difficulty}
          </Badge>
          {ex.equipment && <Badge variant="outline">{ex.equipment.name}</Badge>}
          {ex.isUnilateral && <Badge variant="outline">Unilateral</Badge>}
        </div>
        {ex.description && (
          <p className="text-muted-foreground">{ex.description}</p>
        )}
      </div>

      <Section title="Muscles worked">
        <div className="flex flex-wrap gap-2">
          {ex.primaryMuscles.map((m) => (
            <Badge key={m.id}>{m.name}</Badge>
          ))}
          {ex.secondaryMuscles.map((m) => (
            <Badge key={m.id} variant="secondary">
              {m.name}
            </Badge>
          ))}
          {ex.primaryMuscles.length === 0 &&
            ex.secondaryMuscles.length === 0 && (
              <p className="text-sm text-muted-foreground">No muscles tagged.</p>
            )}
        </div>
      </Section>

      {ex.instructions && (
        <Section title="Instructions">
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {ex.instructions}
          </p>
        </Section>
      )}

      {ex.tips.length > 0 && (
        <Section title="Tips">
          <BulletList items={ex.tips} />
        </Section>
      )}

      {ex.commonMistakes.length > 0 && (
        <Section title="Common mistakes">
          <BulletList items={ex.commonMistakes} />
        </Section>
      )}

      <Section title="History">
        <p className="text-sm text-muted-foreground">
          Your logged sets for this exercise will appear here once you start
          training.
        </p>
      </Section>
    </FadeIn>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-xl border p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
