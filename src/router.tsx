import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

import { initRealtime } from "./lib/realtime";

/**
 * ======================================
 * SINGLE QUERY CLIENT
 * ======================================
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * ======================================
 * INITIALIZE REALTIME (ONLY ONCE)
 * ======================================
 */

initRealtime(queryClient);

/**
 * ======================================
 * ROUTER
 * ======================================
 */

export const getRouter = () => {
  return createRouter({
    routeTree,

    context: {
      queryClient,
    },

    scrollRestoration: true,

    /**
     * FIX: `0` रखने पर hover-preload ("intent") हर बार turant
     * stale हो जाता है, jisse rapid hover par overlapping preload
     * calls race-condition create karte hain aur router ka internal
     * state (`_nonReactive`) crash karta hai.
     * 10 seconds काफी है ताकि preload cache थोड़ी देर valid रहे
     * aur hover करते वक्त race condition na ho.
     */
    defaultPreloadStaleTime: 10_000,

    defaultPreload: "intent",
  });
};

export { queryClient };