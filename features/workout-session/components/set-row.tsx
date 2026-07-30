"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import type { LoggedSet } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function toNum(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function SetRow({
  set,
  index,
  onSave,
  onToggle,
  onDelete,
}: {
  set: LoggedSet;
  index: number;
  onSave: (patch: { weightKg?: number | null; reps?: number | null }) => void;
  onToggle: (completed: boolean) => void;
  onDelete: () => void;
}) {
  // Seeded once from the server value; this row has a stable key={set.id}, so
  // local state stays correct across refetches (saved value === server value).
  const [weight, setWeight] = useState(set.weightKg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  function saveWeight() {
    const v = toNum(weight);
    if (v !== set.weightKg) onSave({ weightKg: v });
  }
  function saveReps() {
    const v = toNum(reps);
    if (v !== set.reps) onSave({ reps: v });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_auto_auto] items-center gap-2 rounded-lg px-2 py-1.5",
        set.isCompleted && "bg-primary/5",
      )}
    >
      <span className="text-center text-sm font-medium text-muted-foreground">
        {index + 1}
      </span>
      <Input
        inputMode="decimal"
        placeholder="kg"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={saveWeight}
        className="h-9 text-center"
      />
      <Input
        inputMode="numeric"
        placeholder="reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={saveReps}
        className="h-9 text-center"
      />
      <motion.button
        type="button"
        onClick={() => onToggle(!set.isCompleted)}
        whileTap={{ scale: 0.85 }}
        aria-label={set.isCompleted ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex size-9 items-center justify-center rounded-lg border transition-colors",
          set.isCompleted
            ? "border-transparent bg-primary text-primary-foreground"
            : "hover:bg-accent",
        )}
      >
        <motion.span
          key={set.isCompleted ? "done" : "todo"}
          initial={{ scale: set.isCompleted ? 0.4 : 1, rotate: set.isCompleted ? -30 : 0 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
        >
          <Check className="size-4" />
        </motion.span>
      </motion.button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete set"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
