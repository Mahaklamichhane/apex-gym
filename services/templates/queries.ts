import type { SupabaseClient } from "@supabase/supabase-js";

export interface TemplateSummary {
  id: string;
  name: string;
  exerciseCount: number;
  preview: string[];
}

interface RawTemplate {
  id: string;
  name: string;
  template_exercises: Array<{ exercise: { name: string } | null }>;
}

export async function fetchTemplates(
  supabase: SupabaseClient,
): Promise<TemplateSummary[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, name, template_exercises ( exercise:exercise_id ( name ) )")
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RawTemplate[]).map((t) => {
    const names = t.template_exercises
      .map((te) => te.exercise?.name)
      .filter(Boolean) as string[];
    return {
      id: t.id,
      name: t.name,
      exerciseCount: names.length,
      preview: names.slice(0, 4),
    };
  });
}
