import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  BarChart3,
  CalendarDays,
  Ruler,
  Salad,
  HeartPulse,
  Target,
  Trophy,
  Sparkles,
  Activity,
  History,
  type LucideIcon,
} from "lucide-react";
import { routes } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = { heading: string; items: NavItem[] };

/** Sidebar + command-palette navigation, grouped. */
export const navGroups: NavGroup[] = [
  {
    heading: "Train",
    items: [
      { label: "Dashboard", href: routes.dashboard, icon: LayoutDashboard },
      { label: "Workout", href: routes.workout, icon: Dumbbell },
      { label: "History", href: routes.history, icon: History },
      { label: "Templates", href: routes.templates, icon: ClipboardList },
      { label: "Exercises", href: routes.exercises, icon: Activity },
    ],
  },
  {
    heading: "Analyze",
    items: [
      { label: "Analytics", href: routes.analytics, icon: BarChart3 },
      { label: "Heatmap", href: routes.heatmap, icon: HeartPulse },
      { label: "Calendar", href: routes.calendar, icon: CalendarDays },
      { label: "Coach", href: routes.coach, icon: Sparkles },
    ],
  },
  {
    heading: "Track",
    items: [
      { label: "Body", href: routes.body, icon: Ruler },
      { label: "Nutrition", href: routes.nutrition, icon: Salad },
      { label: "Recovery", href: routes.recovery, icon: HeartPulse },
      { label: "Goals", href: routes.goals, icon: Target },
      { label: "Achievements", href: routes.achievements, icon: Trophy },
    ],
  },
];

export const navItemsFlat: NavItem[] = navGroups.flatMap((g) => g.items);
