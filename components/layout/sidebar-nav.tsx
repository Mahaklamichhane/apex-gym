"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "@/constants/nav";
import { cn } from "@/lib/utils";

/** The list of grouped nav links. Shared by desktop sidebar and mobile sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.heading} className="space-y-1">
          <p className="px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {group.heading}
          </p>
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
