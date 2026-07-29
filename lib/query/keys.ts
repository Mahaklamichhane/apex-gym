/**
 * Central registry of TanStack Query keys. Import from here everywhere so
 * invalidation is typo-proof and refactor-safe — never inline a raw key array.
 */
export const queryKeys = {
  profile: () => ["profile"] as const,

  exercises: {
    all: () => ["exercises"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["exercises", "list", filters ?? {}] as const,
    detail: (id: string) => ["exercises", "detail", id] as const,
    history: (id: string) => ["exercises", "history", id] as const,
  },

  templates: {
    all: () => ["templates"] as const,
    detail: (id: string) => ["templates", "detail", id] as const,
  },

  sessions: {
    all: () => ["sessions"] as const,
    active: () => ["sessions", "active"] as const,
    detail: (id: string) => ["sessions", "detail", id] as const,
  },

  prs: () => ["personal-records"] as const,
  analytics: (range: string, exerciseId?: string) =>
    ["analytics", range, exerciseId ?? "all"] as const,
  muscleRecovery: () => ["muscle-recovery"] as const,
  coachInsights: () => ["coach-insights"] as const,
  dashboard: () => ["dashboard"] as const,
} as const;
