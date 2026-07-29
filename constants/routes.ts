/** Canonical app routes. Reference these instead of hardcoding path strings. */
export const routes = {
  home: "/",

  dashboard: "/dashboard",
  workout: "/workout",
  session: (id: string) => `/workout/${id}`,
  templates: "/templates",
  template: (id: string) => `/templates/${id}`,
  exercises: "/exercises",
  exercise: (id: string) => `/exercises/${id}`,
  analytics: "/analytics",
  heatmap: "/heatmap",
  calendar: "/calendar",
  body: "/body",
  photos: "/photos",
  nutrition: "/nutrition",
  recovery: "/recovery",
  goals: "/goals",
  achievements: "/achievements",
  coach: "/coach",
  notes: "/notes",
  settings: "/settings",
} as const;
