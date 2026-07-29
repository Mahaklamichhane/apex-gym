import type { Metadata } from "next";
import { TemplatesList } from "@/features/templates/components/templates-list";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Your day plans — Back Day, Push Day, and so on. Start one to run
          through its exercises in order.
        </p>
      </header>
      <TemplatesList />
    </div>
  );
}
