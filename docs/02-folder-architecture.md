# Apex Gym — Folder Architecture

Principle: **feature-first, not type-first.** Code that changes together lives together.
The top-level `features/` directory owns UI + logic per domain. Truly shared primitives
live in `components/ui`, `hooks`, `lib`, `services`, `utils`, `types`. UI never contains
business logic — that lives in `services/` and `hooks/`.

```
apex-gym/
├─ app/                              # Next.js App Router — ROUTING ONLY, thin
│  ├─ (marketing)/                   # public: landing, login
│  │  ├─ page.tsx
│  │  └─ login/page.tsx
│  ├─ (app)/                         # authed shell (layout guards session)
│  │  ├─ layout.tsx                  # sidebar + command palette + providers
│  │  ├─ dashboard/page.tsx
│  │  ├─ workout/
│  │  │  ├─ page.tsx                 # start / resume
│  │  │  └─ [sessionId]/page.tsx     # active Workout Mode
│  │  ├─ templates/
│  │  │  ├─ page.tsx
│  │  │  └─ [templateId]/page.tsx
│  │  ├─ exercises/
│  │  │  ├─ page.tsx
│  │  │  └─ [exerciseId]/page.tsx
│  │  ├─ analytics/page.tsx
│  │  ├─ heatmap/page.tsx
│  │  ├─ calendar/page.tsx
│  │  ├─ body/page.tsx
│  │  ├─ photos/page.tsx
│  │  ├─ nutrition/page.tsx
│  │  ├─ recovery/page.tsx
│  │  ├─ goals/page.tsx
│  │  ├─ achievements/page.tsx
│  │  ├─ coach/page.tsx
│  │  ├─ notes/page.tsx
│  │  └─ settings/page.tsx
│  ├─ api/                           # route handlers only where SSR can't (webhooks, export)
│  │  ├─ export/route.ts
│  │  └─ health/route.ts
│  └─ globals.css
│
├─ features/                         # ⭐ the heart — one folder per domain
│  ├─ dashboard/
│  │  ├─ components/                 # DashboardGrid, widgets/*
│  │  ├─ hooks/                      # useDashboardData
│  │  └─ index.ts
│  ├─ workout-session/               # the most important feature
│  │  ├─ components/                 # WorkoutMode, SetRow, RestTimer, FinishSummary
│  │  ├─ hooks/                      # useActiveSession, useRestTimer
│  │  ├─ store/                      # zustand active-session slice (client draft)
│  │  └─ index.ts
│  ├─ templates/
│  ├─ exercises/
│  ├─ analytics/
│  ├─ heatmap/
│  ├─ calendar/
│  ├─ body/
│  ├─ photos/
│  ├─ nutrition/
│  ├─ recovery/
│  ├─ goals/
│  ├─ achievements/
│  ├─ coach/
│  └─ profile/
│
├─ components/                       # SHARED, domain-agnostic UI only
│  ├─ ui/                            # shadcn primitives (button, card, dialog, …)
│  ├─ charts/                        # Recharts wrappers (LineChart, BarChart w/ theme)
│  ├─ layout/                        # AppSidebar, TopBar, PageHeader
│  ├─ command-palette/               # cmdk global palette
│  ├─ states/                        # EmptyState, ErrorState, LoadingSkeleton
│  └─ providers/                     # QueryProvider, ThemeProvider, SupabaseProvider
│
├─ hooks/                            # cross-feature hooks (useMediaQuery, useDebounce, useHotkeys)
│
├─ services/                         # ⭐ business logic — NO React, pure & testable
│  ├─ supabase/                      # client factory (browser + server + admin)
│  ├─ workouts/                      # session lifecycle, finalize
│  ├─ prs/                           # PR detection algorithms
│  ├─ analytics/                     # volume/1RM/consistency aggregations
│  ├─ coach/                         # rules engine: recovery, plateau, overload, readiness
│  │  ├─ recovery.ts
│  │  ├─ overload.ts
│  │  ├─ plateau.ts
│  │  └─ index.ts
│  ├─ achievements/                  # criteria evaluation
│  └─ export/                        # CSV / JSON serializers
│
├─ lib/                              # framework glue & config
│  ├─ query/                         # TanStack Query client + query keys registry
│  ├─ auth/                          # session helpers, route guards
│  ├─ constants/                     # → see constants below
│  └─ env.ts                         # zod-validated env vars (fail fast on boot)
│
├─ types/                            # shared TS types
│  ├─ database.ts                    # GENERATED from Supabase (source of truth)
│  ├─ domain.ts                      # hand-written domain types built on generated ones
│  └─ index.ts
│
├─ schemas/                          # ⭐ Zod schemas — one per entity, shared client+server
│  ├─ set.ts  exercise.ts  template.ts  profile.ts  ...
│  └─ index.ts
│
├─ constants/                        # enums-as-values, routes, keybindings, muscle map
│  ├─ routes.ts  muscles.ts  units.ts  keybindings.ts
│
├─ utils/                            # pure helpers: units.ts (kg↔lb), date.ts, e1rm.ts, format.ts
│
├─ database/                         # ⭐ the DB lives in the repo
│  ├─ migrations/                    # timestamped SQL (Supabase CLI)
│  ├─ seed/                          # global exercises, muscles, equipment, achievements
│  ├─ policies/                      # RLS policies (readable, one file per table group)
│  └─ functions/                     # triggers & pg functions
│
├─ styles/                           # tailwind layers, design tokens
├─ tests/                            # vitest unit + playwright e2e
├─ docs/                             # these documents
└─ config files (next, tailwind, tsconfig, eslint, .env.example, supabase/)
```

## The layering contract (dependency direction — never violate)

```
app/ (routes)  →  features/  →  hooks/ services/ schemas/ components/ui  →  lib/ utils/ types/
```
- `app/` is thin: fetch initial data (Server Components), render a feature, guard auth.
- `features/` may use anything below it, **never** another feature's internals (only its `index.ts`).
- `services/` is pure TS — no React, no Next imports — so a future mobile app reuses it verbatim.
- `components/ui/` knows nothing about the gym domain.

## Why this survives 5 years
- Adding a feature = adding one `features/x/` folder + one route. No sprawl.
- Deleting a feature = deleting one folder. No orphans.
- Business logic (`services/`) is unit-testable without rendering anything.
- Generated `types/database.ts` means a schema change surfaces as *type errors*, not runtime bugs.
