import type { Metadata } from "next";
import { BodyTracker } from "@/features/body/components/body-tracker";

export const metadata: Metadata = { title: "Body" };

export default function BodyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Body</h1>
        <p className="text-sm text-muted-foreground">
          Log your bodyweight and watch the trend.
        </p>
      </header>
      <BodyTracker />
    </div>
  );
}
