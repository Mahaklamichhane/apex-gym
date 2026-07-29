# Apex Gym — Component Hierarchy

Rules:
- **Server Components by default.** Add `"use client"` only where interactivity/state lives.
- **Presentational vs container:** `components/ui/*` are dumb & reusable; `features/*/components`
  wire data via hooks. Data-fetching lives in hooks/Server Components, never in leaf UI.
- **A feature exposes only its `index.ts`.** Other features import that, never internals.

```
<RootLayout>                                    (server)
├─ <ThemeProvider>                              (client — next-themes)
├─ <QueryProvider>                              (client — TanStack Query)
├─ <SupabaseProvider>                           (client — auth session)
│
├─ (marketing) ─ <LandingPage> / <LoginForm>
│
└─ <AppLayout>                                  (server shell)
   ├─ <AppSidebar>                              (client — active route, collapse)
   │   └─ <NavItem>×n  ·  <UserMenu>
   ├─ <TopBar> ── <PageHeader> · <CommandPaletteTrigger> · <StartWorkoutButton>
   ├─ <CommandPalette>                          (client — cmdk, global ⌘K)
   │   └─ <CommandGroup> (Navigate · Actions · Search exercises)
   └─ <main> {page}

DASHBOARD  <DashboardPage> (server: prefetch) 
└─ <DashboardGrid>
   ├─ <TodaysWorkoutCard>      ├─ <StreakTile>        ├─ <BodyweightTile>
   ├─ <RecoveryScoreTile>      ├─ <MacroTiles>(cal/protein/water)
   ├─ <WeeklyVolumeChart>      ├─ <BodyweightTrendChart>
   ├─ <MuscleRecoveryMini>     ├─ <RecentAchievements> ├─ <LatestPRCard>
   ├─ <GoalCompletion>         ├─ <RecentWorkoutsList>  ├─ <RecentNotesList>
   ├─ <CalendarPreview>        └─ <MotivationalQuote>
   (each widget: <WidgetCard> wrapper handling loading/empty/error uniformly)

WORKOUT MODE  <WorkoutModePage> (client — the app's most stateful screen)
├─ store: useActiveSessionStore (zustand)  ·  autosave via debounced mutation
├─ <WorkoutHeader> (elapsed timer · finish)
├─ <ExercisePager> (swipe/keyboard between session exercises)
│   └─ <ExerciseCard>
│       ├─ <ExerciseHeader> (name · info · prev-best · target)
│       ├─ <SetTable>
│       │   └─ <SetRow>×n  (weight/reps/rpe inputs · complete toggle · type)
│       │       └─ <SetTypeMenu> (warmup/drop/failure/…)
│       ├─ <AddSetButton>
│       └─ <ExerciseNote>
├─ <RestTimerDock> (client — countdown, +15s, skip, auto-start on set complete)
├─ <UndoToast>
└─ <FinishWorkoutSheet> → <WorkoutSummary> (duration/volume/PRs/muscle breakdown)

TEMPLATES
├─ <TemplatesPage> → <TemplateFilters> · <TemplateGrid> → <TemplateCard> (⋯ actions)
└─ <TemplateEditor> (client)
    └─ <TemplateExerciseList> (dnd-kit sortable)
        └─ <TemplateExerciseRow> → <TargetSetEditor>×n · <SupersetBadge>

EXERCISES
├─ <ExerciseLibraryPage> → <ExerciseFilters> · <ExerciseList> → <ExerciseListItem>
└─ <ExerciseDetail> → <ExerciseMedia> · <MuscleTags> · <InstructionTabs>
    · <Exercise1RMChart> · <ExerciseHistoryList> · <AlternativesList>

ANALYTICS  <AnalyticsPage>
├─ <AnalyticsFilters> (range + exercise — synced to URL via nuqs)
├─ <StatTileRow>
└─ <ChartGrid> → chart wrappers over <ChartCard>:
    <VolumeChart> <Est1RMChart> <FrequencyHeatmap> <BodyweightChart>
    <MuscleRadar> <ConsistencyChart> <MacroChart> <RecoveryTrendChart>

HEATMAP  <HeatmapPage> → <BodyMap> (interactive SVG, front/back)
    └─ <MusclePath>×n (colored by recovery)  →  <MuscleDetailPanel>

CALENDAR  <CalendarPage> → <MonthGrid> → <DayCell> (dots) → <DayDetailSheet>

BODY     <BodyPage> → <LogMeasurementForm> · <MeasurementChart>×n · <MeasurementHistory>
PHOTOS   <PhotosPage> → <PhotoUploader> · <PhotoTimeline> · <PhotoCompareSlider>
NUTRITION<NutritionPage> → <DailyLogForm> · <MacroRings> · <NutritionTrendChart>
RECOVERY <RecoveryPage> → <RecoveryLogForm> · <ReadinessGauge> · <RecoveryTrendChart>
GOALS    <GoalsPage> → <GoalForm> · <GoalCard> (progress + ETA) · <GoalList>
ACHIEVE  <AchievementsPage> → <BadgeGrid> → <BadgeCard> (locked/unlocked)
COACH    <CoachPage> → <InsightList> → <InsightCard> (claim + cited data + action)
SETTINGS <SettingsPage> → <ProfileForm> · <GoalsForm> · <PreferencesForm>
    · <EquipmentPicker> · <DataExport> · <ShortcutsList>

SHARED PRIMITIVES (components/)
ui/       Button Card Dialog Sheet Input Select Tabs Toast Skeleton Badge Tooltip Popover…
charts/   <ChartCard> <LineChart> <BarChart> <RadarChart> <Heatmap> (Recharts + theme tokens)
states/   <EmptyState> <ErrorState> <LoadingSkeleton>
layout/   <PageHeader> <Section> <ResponsiveGrid>
```

## Data-access hooks (the bridge to services)
Every feature has thin hooks wrapping TanStack Query + services. Examples:
```
useSession(id) · useStartSession() · useLogSet()      // workout-session
useTemplates() · useTemplate(id) · useSaveTemplate()  // templates
useExercises(filters) · useExerciseHistory(id)        // exercises
useAnalytics(range, exerciseId)                       // analytics (calls services/analytics)
useMuscleRecovery()                                   // heatmap (calls services/coach)
useCoachInsights()                                    // coach (pure services/coach output)
```
Mutations use **optimistic updates** with a shared query-key registry in `lib/query/keys.ts`
so invalidation is centralized and typo-proof.
