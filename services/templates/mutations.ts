import type { SupabaseClient } from "@supabase/supabase-js";

async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

/** Create a day-plan template with an ordered list of exercises. */
export async function createTemplate(
  supabase: SupabaseClient,
  name: string,
  exerciseIds: string[],
): Promise<string> {
  const userId = await requireUserId(supabase);
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name, category: "custom" })
    .select("id")
    .single();
  if (error) throw error;
  const templateId = (data as { id: string }).id;

  if (exerciseIds.length > 0) {
    const rows = exerciseIds.map((exercise_id, position) => ({
      template_id: templateId,
      exercise_id,
      position,
    }));
    const { error: teError } = await supabase
      .from("template_exercises")
      .insert(rows);
    if (teError) throw teError;
  }
  return templateId;
}

export async function deleteTemplate(
  supabase: SupabaseClient,
  templateId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId);
  if (error) throw error;
}

/**
 * Start a workout from a template: create the session and copy the template's
 * exercises into it, in order, each with one empty set ready to log.
 */
export async function startSessionFromTemplate(
  supabase: SupabaseClient,
  templateId: string,
): Promise<string> {
  const userId = await requireUserId(supabase);

  const { data: tpl, error: tplErr } = await supabase
    .from("workout_templates")
    .select("name, template_exercises ( exercise_id, position )")
    .eq("id", templateId)
    .single();
  if (tplErr) throw tplErr;

  const template = tpl as unknown as {
    name: string;
    template_exercises: Array<{ exercise_id: string; position: number }>;
  };

  const { data: sess, error: sessErr } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      status: "active",
      name: template.name,
      template_id: templateId,
    })
    .select("id")
    .single();
  if (sessErr) throw sessErr;
  const sessionId = (sess as { id: string }).id;

  const ordered = [...template.template_exercises].sort(
    (a, b) => a.position - b.position,
  );
  if (ordered.length > 0) {
    const { data: seRows, error: seErr } = await supabase
      .from("session_exercises")
      .insert(
        ordered.map((te, i) => ({
          session_id: sessionId,
          exercise_id: te.exercise_id,
          position: i,
        })),
      )
      .select("id");
    if (seErr) throw seErr;

    const sets = (seRows as Array<{ id: string }>).map((se) => ({
      session_exercise_id: se.id,
      user_id: userId,
      position: 0,
      set_type: "normal",
      is_completed: false,
    }));
    const { error: setErr } = await supabase.from("sets").insert(sets);
    if (setErr) throw setErr;
  }

  return sessionId;
}
