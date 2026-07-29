"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import { fetchActiveSession, fetchSession } from "@/services/workouts/queries";
import * as m from "@/services/workouts/mutations";
import { queryKeys } from "@/lib/query/keys";
import type { LoggedSet } from "@/types/domain";

export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.sessions.active(),
    queryFn: () => fetchActiveSession(createClient()),
    staleTime: 0,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => fetchSession(createClient(), id),
    staleTime: 0,
  });
}

export function useStartWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => m.startEmptySession(createClient()),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions.all() }),
  });
}

/** All the write actions for one active session, each invalidating its query. */
export function useSessionMutations(sessionId: string) {
  const qc = useQueryClient();
  const supabase = createClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });

  const addExercise = useMutation({
    mutationFn: (v: { exerciseId: string; position: number }) =>
      m.addExerciseToSession(supabase, sessionId, v.exerciseId, v.position),
    onSuccess: invalidate,
  });

  const removeExercise = useMutation({
    mutationFn: (sessionExerciseId: string) =>
      m.removeSessionExercise(supabase, sessionExerciseId),
    onSuccess: invalidate,
  });

  const addSet = useMutation({
    mutationFn: (v: { sessionExerciseId: string; position: number }) =>
      m.addSet(supabase, v.sessionExerciseId, v.position),
    onSuccess: invalidate,
  });

  const updateSet = useMutation({
    mutationFn: (v: { setId: string; patch: Parameters<typeof m.updateSet>[2] }) =>
      m.updateSet(supabase, v.setId, v.patch),
    onSuccess: invalidate,
  });

  const deleteSet = useMutation({
    mutationFn: (setId: string) => m.deleteSet(supabase, setId),
    onSuccess: invalidate,
  });

  const finish = useMutation({
    mutationFn: () => m.finishSession(supabase, sessionId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all() }),
  });

  return { addExercise, removeExercise, addSet, updateSet, deleteSet, finish };
}

export type SetPatch = Partial<
  Pick<LoggedSet, "weightKg" | "reps" | "rpe" | "isCompleted" | "setType">
>;
