# Apex Gym — Development Roadmap

Five phases. Each ends with something **usable end-to-end** — not half-features across the
whole app. The guiding rule: **you must be able to log a real workout by end of Phase 2**,
because until you do, every other feature is decorating empty data.

Each item obeys the Definition of Done: UI · responsive · DB-integrated · type-safe ·
validated · error/loading/empty states · documented · tested.

---

## Phase 0 — Foundation (setup, no features yet)
**Goal:** a deployable, type-safe, secured skeleton you can build on without rework.

- [ ] Repo scaffold, pnpm, TypeScript strict, ESLint/Prettier, folder architecture (doc 02).
- [ ] Next.js App Router + Tailwind + shadcn/ui installed; design tokens (dark-first) in `styles/`.
- [ ] Supabase project; local dev via Supabase CLI; migrations workflow in `database/`.
- [ ] `lib/env.ts` zod-validated env; three Supabase clients (browser/server/admin).
- [ ] Auth: login, middleware session refresh, `(app)` route guard, protected shell.
- [ ] TanStack Query provider + query-key registry; ThemeProvider (dark/light/system).
- [ ] AppLayout: sidebar (desktop) + bottom tabs (mobile), empty pages routed.
- [ ] CI: typecheck + lint + Vitest on PR; deploy to Vercel.
- [ ] `types/database.ts` generation script wired to migrations.

**Exit:** you can log in, see the shell, deploy. Zero features, zero debt.

---

## Phase 1 — Core lifting loop ⭐ (the reason the app exists)
**Goal:** create a template, start it, log sets, finish, see it in history. This is the spine.

- [ ] DB: exercises (+seed global list), muscle_groups, equipment, exercise_muscles, RLS.
- [ ] Exercise library + detail (read-only history stub), search, favorites, custom exercises.
- [ ] Templates: create/edit (dnd reorder, target sets), duplicate/favorite/archive, categories.
- [ ] **Workout Mode**: start from template or empty, SetTable logging, rest timer,
      autosave (optimistic + zustand draft), undo, exercise/session notes, finish summary.
- [ ] Sessions + session_exercises + sets tables, finalize trigger (duration, volume).
- [ ] Basic history: past sessions list + a session detail view.

**Exit:** you use it at the gym for real. Everything after this enriches this data.

---

## Phase 2 — Make the loop resilient + first payoffs
**Goal:** trust it with real training; give the first "this is smart" moments.

- [ ] PR engine: detection on finish, `personal_records`, "New PR!" toast + PR history.
- [ ] Resilient session logging: IndexedDB write-queue so an active workout survives
      refresh / signal drop (scoped offline — doc 00 §1.1). **Only** the session.
- [ ] Dashboard v1: today's workout, streak, latest PR, recent workouts, quick actions.
- [ ] Body tracker: log weight + measurements, weight trend chart. (Feeds dashboard weight.)
- [ ] Calendar v1: month grid with workout dots, day-detail sheet.
- [ ] Command palette (⌘K): navigate + quick actions + exercise search.
- [ ] Progressive-overload suggestion v1 (rules): next-session target per exercise.

**Exit:** dependable daily driver with streaks, PRs, bodyweight, calendar.

---

## Phase 3 — Analytics, tracking breadth, muscle heatmap
**Goal:** turn accumulated data into insight and coverage.

- [ ] Analytics dashboards (Recharts): volume, e1RM, frequency, bodyweight, muscle radar,
      consistency; URL-synced filters (nuqs). Aggregations in `services/analytics`.
- [ ] Muscle heatmap: interactive body SVG, recovery model (`services/coach/recovery`),
      per-muscle detail (weekly/monthly sets, history).
- [ ] Nutrition (manual daily totals): log cal/protein/carbs/fat/water, rings, 7-day avg.
- [ ] Recovery logs: sleep/stress/mood/energy/soreness → readiness score.
- [ ] Progress photos: upload (Storage), timeline, compare slider.
- [ ] Goals: create/track lift & body goals, progress %, predicted ETA.
- [ ] Dashboard v2: recovery score, macros, weekly volume, goal completion, muscle mini-map.

**Exit:** full picture — the app replaces the spreadsheet and the notebook.

---

## Phase 4 — Coach & gamification (the "intelligent" layer)
**Goal:** the app tells you what to do, using only your data.

- [ ] Coach rules engine (`services/coach`): plateau detection, weak-muscle / imbalance,
      deload timing, frequency/volume suggestions, exercise recommendations, goal prediction.
      Every insight cites the data that produced it. No LLM.
- [ ] Achievements: definitions + criteria evaluation on relevant writes, badge grid.
- [ ] Overload engine v2: recovery- and RPE-aware recommendations in Workout Mode.
- [ ] (Optional) LLM phrasing layer: turns computed facts into natural language — fed the
      numbers, never allowed to compute. Behind a flag; off by default.

**Exit:** opening the app answers "what should I do today?" with reasons.

---

## Phase 5 — Polish, performance, platform reach
**Goal:** make it feel premium and future-proof.

- [ ] Micro-interactions (Framer Motion), refined empty/loading/error states everywhere.
- [ ] Full keyboard shortcuts, accessibility pass (focus, ARIA, contrast, reduced-motion).
- [ ] Performance: Server Components audit, memoization, query tuning, image optimization,
      route-level code splitting; Lighthouse budget in CI.
- [ ] PWA: installable, offline shell, add-to-home-screen.
- [ ] Export/backup/restore (CSV + JSON), daily journal, pinned notes.
- [ ] Theme customization; workout replay.
- [ ] Documentation pass: README, schema doc, feature docs, changelog, architecture notes.

**Exit:** something you'd proudly ship to millions, running for one.

---

## Deferred by design (not in v1 — architecture already supports)
Apple Health / Google Fit / Garmin / WHOOP / Fitbit sync · barcode scanner · food database ·
true full-app offline · realtime cross-device sync · native mobile app.
All enabled by existing choices: `source`-tagged tables, pure `services/` layer, Postgres-
first writes. Each becomes an additive service, not a rewrite.

## How to sequence within a phase
1. Migration + RLS + seed → 2. Zod schema + generated types → 3. service functions (+ unit
tests) → 4. hooks (queries/mutations) → 5. UI (states last: empty/loading/error) →
6. wire to dashboard/analytics → 7. docs + changelog. Never start UI before the schema.
