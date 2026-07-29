"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import { fetchTemplates } from "@/services/templates/queries";
import {
  createTemplate,
  deleteTemplate,
  startSessionFromTemplate,
} from "@/services/templates/mutations";
import { queryKeys } from "@/lib/query/keys";

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.all(),
    queryFn: () => fetchTemplates(createClient()),
    staleTime: 60 * 1000,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; exerciseIds: string[] }) =>
      createTemplate(createClient(), v.name, v.exerciseIds),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.templates.all() }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(createClient(), id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.templates.all() }),
  });
}

export function useStartFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      startSessionFromTemplate(createClient(), templateId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions.all() }),
  });
}
