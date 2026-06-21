// Single source of truth for backend endpoints
// No endpoint string should be hardcoded anywhere else

export const API = {
  // Dashboard
  dashboard: "/api/dashboard",
  dashboardCharts: "/api/dashboard/charts",

  // Posts
  pending: "/api/posts/pending",
  history: "/api/posts/history",
  upload: "/api/posts/upload",
  postById: (id: string) => `/api/posts/${id}`,
  postNow: "/api/posts/post-now",

  // Settings
  settings: "/api/settings",

  // Cron
  cronRun: "/api/cron/run",
} as const;

export type ApiEndpoints = typeof API;