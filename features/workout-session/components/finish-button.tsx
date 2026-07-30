"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FinishButton({
  onFinish,
  pending,
}: {
  onFinish: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Finish
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-4">
          <DialogHeader>
            <DialogTitle>Finish workout?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This saves your session and ends it. Completed sets count toward your
            stats and PRs.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep going
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onFinish();
              }}
            >
              Finish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
