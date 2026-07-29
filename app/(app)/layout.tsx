import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/services/supabase/server";
import { routes } from "@/constants/routes";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";

/**
 * Authenticated app shell: persistent sidebar (desktop) + top bar with command
 * palette and user menu. The proxy already guards these routes; this re-checks
 * server-side and passes the user's email into the shell.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    // Supabase unreachable (e.g. placeholder keys) — treat as signed out.
  }

  if (!email) redirect(routes.login);

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col border-r px-3 py-4 lg:flex">
        <Link
          href={routes.dashboard}
          className="mb-6 px-3 text-lg font-semibold tracking-tight"
        >
          Apex Gym
        </Link>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar email={email} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
