import { cn } from "@/lib/utils";

/** Apex Gym logo mark — a gradient rounded tile with an upward "peak" (apex). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="apex-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-2)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#apex-grad)" />
      {/* upward apex / mountain peak */}
      <path
        d="M12 27 L20 12 L28 27 M16.5 27 L20 20 L23.5 27"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Logo mark + wordmark, for the sidebar / login header. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-8" />
      <span className="font-display text-lg font-semibold tracking-tight">
        Apex Gym
      </span>
    </span>
  );
}
