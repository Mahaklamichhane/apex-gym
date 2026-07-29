# Apex Gym — API & Data Flow

There is **no custom REST API layer**. Supabase *is* the API (auto-generated,
RLS-guarded). Next.js Server Components read directly; the client reads/writes through
the typed Supabase client wrapped by TanStack Query. Route Handlers (`app/api/*`) exist
only for the few things that aren't plain CRUD (export, webhooks, health).

## The three data paths

```
1. INITIAL READ (page load) — Server Components
   Browser ─req─▶ Next Server Component
                    └─ createServerClient() (user's cookie → RLS as that user)
                    └─ supabase.from('...').select()  ── read ──▶ Postgres (RLS enforced)
                 ◀── HTML (data already in it) ── streamed to browser
   Then hydrate: TanStack Query is seeded with the same data (no refetch flash).

2. CLIENT READ (navigation, refetch, filters) — TanStack Query
   Component ─▶ useQuery(key, () => service.fetchX())
                 └─ services/* ─▶ createBrowserClient().from('...').select()
                 ◀─ cached in Query cache (staleTime tuned per entity)

3. WRITE — optimistic mutation
   Component ─▶ useMutation(service.logSet)
     ├─ onMutate:  write to Query cache immediately (UI updates now)   ← feels instant
     ├─ mutationFn: supabase.from('sets').insert(...) ─▶ Postgres (RLS check)
     ├─ onError:   rollback cache to snapshot
     └─ onSettled: invalidate affected keys (session, analytics, PRs)
```

## staleTime policy (server-state freshness)
| Data | staleTime | Why |
|---|---|---|
| exercises library | 24h | changes rarely |
| templates | 5 min | edited occasionally |
| active session | 0 (always fresh) | source of truth is being written now |
| history / analytics | 5 min | tolerates slight staleness |
| dashboard | 1 min | wants to feel live |

## The Zod contract (validation once, everywhere)
```
schemas/set.ts  ──▶  used by:
   • React Hook Form resolver (client-side field validation)
   • the mutation service (parse before insert — defense in depth)
   • types inferred via z.infer — no separate TS type to drift
Postgres constraints + RLS are the *final* guard. Three layers, one schema.
```

## Write lifecycle example — logging a set in Workout Mode
```
user types 92.5 / 5 / rpe8, taps ✓
 └─ zustand active-session store updates the draft (instant, local)
 └─ debounced (400ms) useLogSet mutation fires
      onMutate    → patch sets in Query cache; UI already shows it
      mutationFn  → services/workouts.upsertSet()
                     → zod parse → supabase.upsert (est_1rm computed by trigger)
      onSettled   → invalidate: ['session',id], ['exercise-history',exId]
 └─ RestTimerDock auto-starts (client)
On "Finish":
 └─ services/workouts.finalizeSession()
      → status='completed' → trigger session_finalize():
          duration, total_volume, PR detection (writes personal_records),
          achievement checks (writes user_achievements)
      → invalidate dashboard, analytics, PRs, calendar, coach
      → if PRs found → toast "New PR!" + confetti
```

## The "smart" features are pure functions, not endpoints
```
services/coach/*  and  services/analytics/*  are pure TS:
   input  = rows already fetched (sessions, sets, measurements, recovery_logs)
   output = derived facts (recovery status, plateau flags, overload rec, insights)
No network of their own. Called from Server Components (SSR insights) or hooks.
This is why the AI Coach can NEVER hallucinate — it only does arithmetic on your rows.
```

## Auth & route protection
```
middleware.ts       → refresh Supabase session cookie on every request
(app)/layout.tsx    → server-side: no session ⇒ redirect('/login')
RLS                 → the real guard: even a leaked query returns only your rows
services/supabase/  → three clients: browser · server(cookie) · admin(service_role, server-only, migrations/exports)
```

## Storage (photos)
```
upload: client → supabase.storage.from('progress-photos').upload(`${userId}/${uuid}.jpg`)
        → insert progress_photos row (storage_path)
access: signed URLs (bucket private); RLS-style path prefix = userId ensures isolation
```

## Export / Backup (the one real Route Handler)
```
GET /api/export?format=csv|json
  → server client (RLS) → gather user's rows → serialize → stream download
  Restore = a guided import validating against the same Zod schemas.
```

## Realtime (deferred, designed-for)
Supabase Realtime can later push session updates across devices (log on phone, watch on
laptop). Not built in v1 — but because writes already go through Postgres, enabling it is
a subscription, not a refactor.
