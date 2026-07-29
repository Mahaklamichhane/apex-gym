import type { Metadata } from "next";
import { Dashboard } from "@/features/dashboard/components/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Dashboard />
    </div>
  );
}
