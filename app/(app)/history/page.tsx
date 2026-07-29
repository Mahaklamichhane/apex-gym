import type { Metadata } from "next";
import { HistoryList } from "@/features/history/components/history-list";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Every workout you&apos;ve completed. Tap one to see the details.
        </p>
      </header>
      <HistoryList />
    </div>
  );
}
