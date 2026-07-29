import Link from "next/link";
import { Settings } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { routes } from "@/constants/routes";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <MobileNav />
      <div className="flex-1" />
      <CommandPalette />
      <Link
        href={routes.settings}
        aria-label="Settings"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Settings className="size-4" />
      </Link>
    </header>
  );
}
