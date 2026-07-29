"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, Play, Trash2 } from "lucide-react";
import {
  useTemplates,
  useDeleteTemplate,
  useStartFromTemplate,
} from "../hooks/use-templates";
import { CreateTemplateDialog } from "./create-template-dialog";
import { routes } from "@/constants/routes";
import { EmptyState, ListSkeleton } from "@/components/states";

export function TemplatesList() {
  const router = useRouter();
  const { data, isPending } = useTemplates();
  const del = useDeleteTemplate();
  const start = useStartFromTemplate();

  async function startPlan(id: string) {
    try {
      const sessionId = await start.mutateAsync(id);
      router.push(routes.session(sessionId));
    } catch {
      toast.error("Couldn't start this plan");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Save a day plan once, then start it with one tap.
        </p>
        <CreateTemplateDialog />
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No plans yet"
          description="Create a plan like “Back Day” with your exercises in order."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((t) => (
            <div key={t.id} className="rounded-xl border p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.exerciseCount} exercises
                  </p>
                </div>
                <button
                  onClick={() => del.mutate(t.id)}
                  aria-label="Delete plan"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {t.preview.length > 0 && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {t.preview.join(" · ")}
                  {t.exerciseCount > t.preview.length ? " · …" : ""}
                </p>
              )}

              <button
                onClick={() => startPlan(t.id)}
                disabled={start.isPending}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Play className="size-4" /> Start
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
