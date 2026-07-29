import { QueryClient } from "@tanstack/react-query";

/**
 * Default query behavior. staleTime is tuned low here and overridden per-query
 * (e.g. exercises library = 24h, active session = 0). See docs/05-data-flow.md.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min — a sensible floor; override per query
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
