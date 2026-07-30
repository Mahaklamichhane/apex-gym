import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { CommandPalette } from "@/components/command-palette/command-palette";

export function TopBar({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <MobileNav />
      <div className="flex-1" />
      <CommandPalette />
      <UserMenu name={name} />
    </header>
  );
}
