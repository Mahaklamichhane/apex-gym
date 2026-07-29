# Apex Gym — UI Wireframes

Low-fidelity, dark-mode-first. These define *layout and information hierarchy*, not final
visuals. Shared shell (persistent left sidebar on desktop, bottom tab bar on mobile) wraps
every authed page. `⌘K` opens the command palette everywhere.

Legend: `▸` button · `○` metric tile · `▭` chart · `≡` list · `[ ]` input

---

## Global shell

```
DESKTOP (≥1024px)                                  MOBILE (<768px)
┌──────┬──────────────────────────────────┐        ┌────────────────────────┐
│ APEX │  Page Header        [⌘K]  ▸Start  │        │ ← Title          [⌘K]  │
│      ├──────────────────────────────────┤        ├────────────────────────┤
│ ▸Dash│                                   │        │                        │
│ ▸Work│         PAGE CONTENT              │        │     PAGE CONTENT       │
│ ▸Tmpl│                                   │        │                        │
│ ▸Exer│                                   │        │                        │
│ ▸Anly│                                   │        ├────────────────────────┤
│ ▸Body│                                   │        │ 🏠  📊  ⊕  🔥  👤      │
│ ▸...│                                    │        │        (Start = ⊕)     │
│ ─────│                                   │        └────────────────────────┘
│ 👤 me│                                   │
└──────┴───────────────────────────────────┘
```

---

## 1. Dashboard — "What do I do today?"

Top row answers it in one glance. Everything below is progressive detail. Widgets are
cards in a responsive grid; each is independently loading/empty-aware.

```
┌───────────────────────────────────────────────────────────────┐
│  Good evening, Mahak · Fri, Jul 29        [⌘K]      ▸ Start ▾   │
├──────────────── TODAY ────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌────────┐┌────────┐┌────────┐       │
│  │ TODAY'S WORKOUT      │  │🔥 Streak││Weight  ││Recovery│       │
│  │ Push Day A           │  │  12 d  ││ 78.4kg ││  84 %  │       │
│  │ 6 exercises · ~52min │  └────────┘└────────┘└────────┘       │
│  │        ▸ Start now   │  ┌────────┐┌────────┐┌────────┐       │
│  └─────────────────────┘  │Calories││Protein ││ Water  │       │
│                           │1850/2400││120/180g││1.2/3 L │       │
│                           └────────┘└────────┘└────────┘       │
├──────────────── THIS WEEK ────────────────────────────────────┤
│  ▭ Weekly volume (bar, Mon–Sun)     ▭ Bodyweight trend (30d)   │
│  ○ Goal completion 3/5   ○ Latest PR: Bench 92.5kg (+2.5)      │
├──────────────── MORE ─────────────────────────────────────────┤
│  Muscle recovery overview (mini body map)   Recent achievements│
│  ≡ Recent workouts        ≡ Recent notes    Calendar preview   │
│  "Discipline is choosing between what you want now and later." │
└───────────────────────────────────────────────────────────────┘
Quick actions (▸Start ▾): Log weight · Log water · New note · Empty workout
```

---

## 2. Workout Mode (the make-or-break screen)

Full-focus, minimal chrome, thumb-reachable on mobile. One exercise in focus; swipe/
arrows to move between exercises. Rest timer docks at the bottom. Autosaves every change.

```
┌───────────────────────────────────────────────────────────────┐
│ ✕  Push Day A                      ⏱ 24:18            ▸ Finish  │
├───────────────────────────────────────────────────────────────┤
│  Exercise 2 / 6            ‹ prev            next ›             │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  BARBELL BENCH PRESS                          ⓘ  ⋯         ││
│  │  Last time: 90kg × 5,5,4      Target: 92.5kg × 5 @RPE8     ││
│  ├──────┬────────┬───────┬──────┬──────┬────────────────────┤│
│  │ SET  │ PREV   │ KG    │ REPS │ RPE  │        ✓            ││
│  │  W    │ 40×8  │[40  ] │[10 ] │ —    │   [✓ done]          ││
│  │  1    │ 90×5  │[92.5] │[5  ] │[8  ] │   [✓ done]          ││
│  │  2    │ 90×5  │[92.5] │[5  ] │[  ] │   [ done]            ││
│  │  3    │ 90×4  │[92.5] │[  ] │[  ] │   [ done]            ││
│  │            ▸ + Add set        ▸ Warmup   ▸ Drop           ││
│  └───────────────────────────────────────────────────────────┘│
│  📝 Exercise note: "elbows tucked, paused reps"               │
├───────────────────────────────────────────────────────────────┤
│  ⏱ REST 1:30  ●──────────○   ▸ +15s  ▸ skip     ↺ Undo        │
└───────────────────────────────────────────────────────────────┘
Finish → summary: duration, total volume, PRs hit ✦, per-muscle sets, notes.
```

---

## 3. Templates

```
┌──────────────────────────────────────────────────────┐
│ Templates            [search]  ▸ New template          │
│ Filters: [Push][Pull][Legs][Upper][Lower][Full][★]     │
├──────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐             │
│ │ Push A  ★ │ │ Pull A    │ │ Legs A    │             │
│ │ 6 ex·52min│ │ 5 ex·48min│ │ 6 ex·60min│             │
│ │ Push      │ │ Pull      │ │ Legs      │             │
│ │ ▸Start ⋯  │ │ ▸Start ⋯  │ │ ▸Start ⋯  │             │
│ └───────────┘ └───────────┘ └───────────┘             │
│  ⋯ menu: Duplicate · Favorite · Archive · Share · Edit │
└──────────────────────────────────────────────────────┘
Editor: drag-reorder exercises (dnd-kit), per-set target reps/kg/RPE/rest, supersets.
```

---

## 4. Exercise Library / Detail

```
LIBRARY                                DETAIL
┌───────────────────────────┐          ┌────────────────────────────────┐
│ Exercises  [search…] ▸New  │          │ ‹ Back   BARBELL BENCH   ★  ⋯  │
│ [Chest][Back][Legs][★][Mine]│          │ [gif/video]                     │
├───────────────────────────┤          │ Primary: Chest  Sec: Tri, Delt  │
│ ≡ Barbell Bench   Chest  ★ │          │ Equipment: Barbell · Intermediate│
│ ≡ Incline DB      Chest    │          ├─ Instructions ─ Tips ─ Mistakes ┤
│ ≡ Cable Fly       Chest    │          │ ▭ Est 1RM over time             │
│ ≡ Pull-up         Back   ★ │          │ ≡ History (every logged set)    │
│ …                          │          │ Alternatives: Incline DB, DB fly│
└───────────────────────────┘          └────────────────────────────────┘
```

---

## 5. Analytics

```
┌──────────────────────────────────────────────────────┐
│ Analytics     Range:[1M][3M][6M][1Y][All]  Ex:[all ▾] │
├──────────────────────────────────────────────────────┤
│ ○ Volume 42.1k kg  ○ Workouts 18  ○ Avg 54m  ○ 6 PRs  │
│ ▭ Training volume (weekly)      ▭ Estimated 1RM (line) │
│ ▭ Workout frequency (heat)      ▭ Bodyweight vs goal   │
│ ▭ Muscle frequency (radar)      ▭ Consistency (streak) │
│ ▭ Calories/Protein/Water        ▭ Recovery trend       │
└──────────────────────────────────────────────────────┘
Filters live in the URL (?range=3M&exercise=bench) — shareable, back-safe.
```

---

## 6. Muscle Heatmap

```
┌────────────────────────────────────────────────┐
│ Muscle Heatmap        Front ⟷ Back              │
│        ┌─────────┐   Legend: ▓fresh ▒fatigued   │
│        │  human  │           ░recovered ■over    │
│        │  body   │   Tap a muscle →              │
│        │  SVG    │   ┌──────────────────────────┐│
│        │ colored │   │ CHEST                     ││
│        └─────────┘   │ Weekly sets: 14  Mon: 3  ││
│                      │ Recovery: Fresh (2d ago) ││
│                      │ Top exercises · History  ││
│                      └──────────────────────────┘│
└────────────────────────────────────────────────┘
```

---

## 7. Calendar

```
┌───────────────────────────────────────────┐
│ ‹ July 2026 ›                    ▸ Today    │
│ Mo Tu We Th Fr Sa Su                       │
│  1● 2  3● 4  5  6● 7                        │  ● = workout (color by category)
│  8● 9 10●11 12 13●14        dot row per day:│  · vol · weight · mood
│ …                                          │
├───────────────────────────────────────────┤
│ Tap 29 → full day: workout, sets, volume,  │
│ calories, protein, water, mood, weight,    │
│ sleep, recovery, PRs, notes                │
└───────────────────────────────────────────┘
```

---

## 8. Body Tracker · 9. Photos · 10. Nutrition · 11. Recovery · 12. Goals · 13. Achievements · 14. Coach · 15. Settings

```
BODY                         PHOTOS                     NUTRITION (manual daily)
┌───────────────┐            ┌───────────────┐          ┌────────────────────┐
│ ▸ Log measure │            │ ▸ Add photo    │          │ ▸ Log today         │
│ ▭ Weight line │            │ [grid by month]│          │ ○ 1850/2400 kcal    │
│ ▭ Waist/Arms  │            │ Compare slider │          │ ○P ○C ○F ○Water     │
│ ≡ 16 metrics  │            │ front|side|back│          │ ▭ 7-day avg         │
└───────────────┘            └───────────────┘          └────────────────────┘

RECOVERY                     GOALS                      ACHIEVEMENTS
┌───────────────┐            ┌───────────────┐          ┌───────────────┐
│ ▸ Log day     │            │ ▸ New goal     │          │ [badge grid]   │
│ Sleep/Stress/ │            │ Bench 100kg    │          │ ✦ unlocked     │
│ Mood/Energy/  │            │ ▓▓▓▓▓░ 92.5/100│          │ ▢ locked (?)   │
│ Soreness      │            │ ETA: Sep 2026  │          │ progress bars  │
│ ○ Readiness 84│            │ ≡ other goals  │          └───────────────┘
└───────────────┘            └───────────────┘

COACH (rules engine, explainable)          SETTINGS
┌──────────────────────────────┐           ┌──────────────────────────┐
│ Insights (each cites data):  │           │ Profile · Units · Theme  │
│ ⚠ Bench e1RM flat 4wk → deload│           │ Goals(cal/protein/water) │
│ ↑ Add 2.5kg to squat next    │           │ Equipment · Notifications│
│ ⚖ Left arm 1.5cm < right     │           │ Export CSV/JSON · Backup │
│ 😴 Low readiness → easy day  │           │ Keyboard shortcuts       │
└──────────────────────────────┘           └──────────────────────────┘
```

## Cross-cutting states (every screen)
- **Loading:** skeletons matching final layout (never spinners on content).
- **Empty:** friendly illustration + one primary CTA ("Log your first workout").
- **Error:** inline retry, never a blank screen.
- **Optimistic:** writes appear instantly; a subtle sync dot shows pending.
