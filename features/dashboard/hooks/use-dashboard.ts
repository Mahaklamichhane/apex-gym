"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/services/supabase/client";
import { fetchDashboard } from "@/services/dashboard/queries";
import { queryKeys } from "@/lib/query/keys";

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => fetchDashboard(createClient()),
    staleTime: 30 * 1000,
  });
}
