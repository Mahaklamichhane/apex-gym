import {
  LayoutDashboard,
  Dumbbell,
  History,
  ClipboardList,
  Activity,
  Ruler,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { routes } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = { heading: string; items: NavItem[] };

/**
 * Sidebar + command-palette navigation. Only pages that actually exist are
 * listed here — add a group/item when the corresponding feature ships.
 */
export const navGroups: NavGroup[] = [
  {
    heading: "Train",
    items: [
      { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
      { label: "Workout", href: routes.workout, icon: Dumbbell },
      { label: "History", href: routes.history, icon: History },
      { label: "Plans", href: routes.templates, icon: ClipboardList },
      { label: "Exercises", href: routes.exercises, icon: Activity },
    ],
  },
  {
    heading: "Track",
    items: [{ label: "Body", href: routes.body, icon: Ruler }],
  },
  {
    heading: "Community",
    items: [
      { label: "Leaderboard", href: routes.leaderboard, icon: Trophy },
    ],
  },
];

export const navItemsFlat: NavItem[] = navGroups.flatMap((g) => g.items);
