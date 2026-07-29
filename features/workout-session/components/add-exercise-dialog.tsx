"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useExercises } from "@/features/exercises/hooks/use-exercises";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/states";

export function AddExerciseDialog({
  onAdd,
  pending,
}: {
  onAdd: (exerciseId: string) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: exercises, isPending } = useExercises();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (exercises ?? []).filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <Plus className="size-4" /> Add exercise
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search exercises…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="-mx-2 max-h-[52dvh] overflow-y-auto px-2">
          {isPending ? (
            <ListSkeleton rows={5} />
          ) : (
            <ul className="divide-y">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => {
                      onAdd(ex.id);
                      setOpen(false);
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ex.primaryMuscles.map((mm) => mm.name).join(", ") ||
                        "—"}
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No exercises found.
                </li>
              )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
