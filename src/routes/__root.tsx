/**
 * FILE: src/routes/__root.tsx
 * STATUS: UPDATED (Clean + Stable Root Layout)
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { Toaster } from "@/components/ui/sonner";

/**
 * =========================
 * 404 PAGE
 * =========================
 */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl px-8 py-10 text-center">
        <h1 className="font-display text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-3 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-medium text-primary-foreground glow"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

/**
 * =========================
 * ERROR BOUNDARY
 * =========================
 */
function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("ROOT ERROR:", error);

    reportLovableError(error, {
      boundary: "root-layout",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl px-8 py-10 text-center">
        <h1 className="font-display text-xl font-semibold">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Backend or frontend runtime error occurred.
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>

          <a
            href="/"
            className="rounded-md border border-border bg-background/40 px-4 py-2 text-sm font-medium"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * =========================
 * ROOT ROUTE CONFIG
 * =========================
 */
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Instagram Auto Poster — Dashboard" },
      {
        name: "description",
        content: "Auto post images & reels with smart scheduling system",
      },
      { name: "theme-color", content: "#0d0a18" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * =========================
 * HTML SHELL
 * =========================
 */
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * =========================
 * APP LAYOUT
 * =========================
 */
function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />

          <SidebarInset className="flex min-w-0 flex-1 flex-col">
            <TopNav />

            <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>

        <Toaster position="top-right" richColors theme="dark" />
      </SidebarProvider>
    </QueryClientProvider>
  );
}