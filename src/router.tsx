import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 60 seconds — avoids redundant network trips
        // on tab focus or component remounts.
        staleTime: 60_000,
        // Only retry once on failure to avoid hanging UX on bad networks
        retry: 1,
        retryDelay: 1000,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload routes on hover/focus (250ms intent delay) — navigation feels instant
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
  });

  return router;
};
