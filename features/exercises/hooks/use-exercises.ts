"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import {
  fetchExercises,
  fetchExerciseById,
  fetchMuscleGroups,
} from "@/services/exercises/queries";
import { queryKeys } from "@/lib/query/keys";

const DAY = 24 * 60 * 60 * 1000;

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises.all(),
    queryFn: () => fetchExercises(createClient()),
    staleTime: DAY, // library changes rarely
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: () => fetchExerciseById(createClient(), id),
    staleTime: DAY,
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ["muscle-groups"],
    queryFn: () => fetchMuscleGroups(createClient()),
    staleTime: Infinity, // static reference data
  });
}
