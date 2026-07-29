# Apex Gym — Architecture Overview & Key Decisions

> Read this first. It contains the decisions that shape everything else, including
> the places where I pushed back on the v1.0 spec. Nothing here is final — these are
> recommendations with tradeoffs so *you* can decide.

---

## 1. Where I'm challenging the spec

You asked me to challenge bad ideas rather than autocomplete. Here are the six that
matter most. Each one is a fork that, if we get it wrong now, costs weeks later.

### 1.1 "Offline Support + Cloud Sync" is the biggest debt trap in the spec

Full bidirectional offline sync with conflict resolution against Postgres is a
*product in itself* (this is what Replicache, ElectricSQL, PowerSync exist to solve).
Building it by hand while also building 20 feature areas guarantees either bugs or a
stalled project.

**Recommendation — tiered, not all-or-nothing:**

| Tier | What it means | When |
|---|---|---|
| **Optimistic UI** | Writes apply to the local cache instantly, sync in background. Feels offline, needs network. | Phase 1 — do this everywhere. |
| **Resilient logging** | The *active workout session* survives refresh/网络 drop via a local write queue (IndexedDB). Only the session, nothing else. | Phase 2 |
| **True offline** | Whole app works on a plane, syncs later. | Deferred — revisit only if you actually train without signal. |

The active workout is the *only* place offline genuinely matters (you're mid-set,
gym wifi drops). Scoping offline to that one flow removes ~80% of the complexity.

### 1.2 You're missing a server-cache layer — Zustand is not enough

Zustand is excellent for **client state** (UI, active-workout draft, theme). It is the
wrong tool for **server state** (exercises, history, analytics). Using it for both means
you hand-write caching, refetching, and invalidation — classic debt.

**Add TanStack Query (React Query).** Division of labor:

- **TanStack Query** → everything from Supabase (fetch, cache, optimistic updates, invalidation).
- **Zustand** → active workout session draft, command palette, UI/theme, timers.
- **Server Components** → initial data fetch for read-heavy pages (dashboard, analytics).

This one addition removes the majority of your "Cloud Sync / Caching / Optimistic
Updates" hand-rolling.

### 1.3 The AI Coach should NOT start as an LLM

Your own spec says *"Never hallucinate. Only use stored data."* An LLM cannot guarantee
that. Every insight you listed — plateaus, imbalance, deload timing, weak muscles — is a
**deterministic calculation over your own data**. That's a rules engine, and it's better:
explainable, free, instant, testable, and it never lies.

**Recommendation:** Build the "AI Coach" as a **rules/heuristics engine** (`services/coach/`).
Layer an LLM *on top* later purely for natural-language *phrasing* of already-computed facts
(and even then, feed it the numbers, never let it compute them). This is the difference
between "your bench e1RM has been flat for 4 weeks across 6 sessions → deload" (a fact) and
a chatbot guessing.

### 1.4 Nutrition-with-a-food-database is a second product — scope it down

Full macro tracking implies a food database, search, barcode scanning, portion math.
That's MyFitnessPal. Building it derails the gym app.

**Recommendation:** Phase 3 nutrition = **manual daily totals** (calories, protein, carbs,
fat, water) against goals. That satisfies the dashboard + analytics + goals needs.
A searchable food DB / barcode is a *future integration*, designed-for but not built (see §3).

### 1.5 Don't build 30 dashboard widgets before you have data to fill them

A dashboard with 30 widgets and no workout history is empty and depressing. The dashboard
is a *view over data that must exist first*. It gets built incrementally as each feature
lands, not up front.

### 1.6 "Muscle recovery" needs a defined model, or it's fiction

"Recovered / Fatigued / Overtrained" implies a recovery model. Undefined, it becomes a
random color generator. We define it explicitly (see DB `muscle_recovery` + coach service):
recovery = f(sets landed on muscle, days since, intensity/RPE, your recovery logs). Simple,
transparent, tunable — not a black box.

---

## 2. Stack — approved, with additions

Your stack is modern and correct. Confirmed as-is:

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres/Auth/Storage)
· Zustand · Zod · React Hook Form · Recharts · Framer Motion · Lucide · Vercel · pnpm

**Additions I'm recommending:**

- **TanStack Query** — server-state cache (see §1.2). Non-negotiable for maintainability.
- **`cmdk`** — the command palette (shadcn wraps it).
- **`date-fns`** — date math (lighter than moment/luxon, tree-shakeable).
- **`dnd-kit`** — drag-reorder for template exercises & sets.
- **`nuqs`** — typed URL search-param state for analytics filters (shareable, back-button-safe).
- **Vitest + Playwright** — unit + e2e. Your "Definition of Done" requires tests.
- **`zod` on both sides** — one schema per entity, shared client/server (validation once).

**One deliberate omission:** no state library beyond Zustand + React Query. Resist Redux.

---

## 3. Designed-for-but-not-built (future compatibility)

The spec lists Apple Health, Google Fit, Garmin, WHOOP, barcode, wearables, PWA, mobile.
We do **not** build these now. We make them *cheap to add later* by:

- **A source-tagged ingestion pattern:** body-weight, sleep, steps, HR all land in tables
  with a `source` column (`manual` | `apple_health` | `whoop` | …) and a nullable
  `external_id`. Adding a provider later = a new sync service writing rows, zero schema change.
- **A clean service layer** (`services/`) so a future React Native app reuses all business
  logic and types.
- **PWA-ready** Next config (installable, service worker) is a Phase 5 flip, not a rewrite.

---

## 4. Guiding principles (the tie-breakers)

1. **Simplest thing that stays scalable.** Multi-user-ready schema, single-user reality.
2. **Server state ≠ client state.** Never blur them.
3. **Compute, don't guess.** Every "smart" feature is math over your data until proven otherwise.
4. **One Zod schema per entity**, shared everywhere — DB types, forms, API validation.
5. **Feature-first folders** (`features/workouts/`) over type-first sprawl.
6. **RLS on every user table, no exceptions**, even at 1 user. Security is not a phase.
