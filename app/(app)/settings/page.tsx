import type { Metadata } from "next";
import { Settings } from "@/features/settings/components/settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Appearance, profile, and daily goals.
        </p>
      </header>
      <Settings />
    </div>
  );
}
