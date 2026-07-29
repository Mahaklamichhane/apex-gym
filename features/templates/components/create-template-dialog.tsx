"use client";

import { useMemo, useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useExercises } from "@/features/exercises/hooks/use-exercises";
import { useCreateTemplate } from "../hooks/use-templates";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Picked {
  id: string;
  name: string;
}

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [search, setSearch] = useState("");
  const { data: exercises } = useExercises();
  const create = useCreateTemplate();

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    const chosen = new Set(picked.map((p) => p.id));
    return (exercises ?? []).filter(
      (e) => !chosen.has(e.id) && e.name.toLowerCase().includes(q),
    );
  }, [exercises, picked, search]);

  function reset() {
    setName("");
    setPicked([]);
    setSearch("");
  }

  async function save() {
    if (!name.trim()) return toast.error("Give your plan a name");
    if (picked.length === 0) return toast.error("Add at least one exercise");
    try {
      await create.mutateAsync({
        name: name.trim(),
        exerciseIds: picked.map((p) => p.id),
      });
      toast.success("Plan saved");
      setOpen(false);
      reset();
    } catch {
      toast.error("Couldn't save the plan");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <button
        onClick={() => setOpen(true)}
        className={cn(buttonVariants())}
      >
        <Plus className="size-4" /> New plan
      </button>

      <DialogContent className="max-h-[85dvh] gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>New workout plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="tpl-name">Plan name</Label>
          <Input
            id="tpl-name"
            autoFocus
            placeholder="e.g. Back Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {picked.length > 0 && (
          <div className="space-y-1.5">
            <Label>In order</Label>
            <ol className="space-y-1">
              {picked.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <GripVertical className="size-4 text-muted-foreground" />
                  <span className="w-5 text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <button
                    onClick={() =>
                      setPicked((prev) => prev.filter((x) => x.id !== p.id))
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Add exercises</Label>
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="-mx-2 max-h-[30dvh] overflow-y-auto px-2">
            <ul className="divide-y">
              {available.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() =>
                      setPicked((prev) => [...prev, { id: ex.id, name: ex.name }])
                    }
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                  >
                    <span>{ex.name}</span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button onClick={save} disabled={create.isPending}>
          Save plan
        </Button>
      </DialogContent>
    </Dialog>
  );
}
