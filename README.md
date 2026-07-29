# Apex Gym

Personal fitness operating system. Long-term, single-user-now / multi-user-ready.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres/
Auth/Storage) · TanStack Query + Zustand · Zod · React Hook Form · Recharts · Framer
Motion · Lucide · Vercel · pnpm.

## Architecture docs (read in order)
1. [Architecture Overview & Key Decisions](docs/00-architecture-overview.md) — **start here** (includes where the v1.0 spec was challenged)
2. [Database Schema](docs/01-database-schema.md) — tables, relationships, indexes, RLS
3. [Folder Architecture](docs/02-folder-architecture.md)
4. [UI Wireframes](docs/03-wireframes.md)
5. [Component Hierarchy](docs/04-component-hierarchy.md)
6. [API & Data Flow](docs/05-data-flow.md)
7. [Development Roadmap](docs/06-roadmap.md) — Foundation → Core → Analytics → Coach → Polish

## Built so far
- ✅ **Database layer** — runnable SQL in [`database/`](database/README.md): schema, triggers,
  RLS, and a seed of 18 muscle groups / 9 equipment / 26 global exercises / 11 achievements.
- ✅ **App scaffold (Phase 0)** — Next.js 16 + React 19 + Tailwind v4, dark-first theme,
  Supabase clients (browser/server) + auth proxy, TanStack Query + next-themes providers,
  Zod schema pattern, env validation. Builds & typechecks clean.

## Local development
```bash
pnpm install
cp .env.example .env.local   # then paste your real Supabase URL + anon key
pnpm dev                     # http://localhost:3000
```
Regenerate DB types after schema changes: see [`types/database.ts`](types/database.ts).

## The five decisions that shape everything
- **Offline is scoped to the active workout only** — not the whole app (avoids the biggest debt trap).
- **TanStack Query for server state, Zustand for client state** — never blur them.
- **The "AI Coach" is a rules engine, not an LLM** — so it literally cannot hallucinate.
- **Nutrition v1 is manual daily totals** — a food database is a separate future product.
- **RLS on every user table from day one** — security is not a phase.
