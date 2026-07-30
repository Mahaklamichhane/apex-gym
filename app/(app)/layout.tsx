import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/services/supabase/server";
import { routes } from "@/constants/routes";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopBar } from "@/components/layout/top-bar";

/** Authenticated app shell. Each signed-in user sees only their own data (RLS). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  let name: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      name =
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Athlete";
    }
  } catch {
    // Supabase unreachable — treat as signed out.
  }

  if (!name) redirect(routes.login);

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
        <TopBar name={name} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
