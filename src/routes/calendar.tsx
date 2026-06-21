// src/routes/calendar.tsx

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { PostsService } from "@/services/api";
import { cn } from "@/lib/utils";

/**
 * =========================
 * ROUTE
 * =========================
 */
export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [{ title: "Calendar — Instagram Auto Poster" }],
  }),
  component: CalendarPage,
});

/**
 * =========================
 * DATE HELPERS
 * =========================
 */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * =========================
 * MAIN COMPONENT
 * =========================
 */
function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [openDay, setOpenDay] = useState<Date | null>(null);

  /**
   * =========================
   * API CALLS (SAFE)
   * =========================
   */
  const { data: pendingRaw } = useQuery({
    queryKey: ["pending"],
    queryFn: PostsService.pending,
  });

  const { data: historyRaw } = useQuery({
    queryKey: ["history"],
    queryFn: PostsService.history,
  });

  /**
   * =========================
   * NORMALIZE DATA (FIXED)
   *
   * `pendingRaw` / `historyRaw` का exact shape backend response
   * पर depend करता है (array हो सकता है, या { data: [] },
   * या { items: [] }). useQuery को explicit type नहीं दी गई
   * इसलिए TypeScript इन्हें "{}" मान लेता था -> property access
   * errors (TS2339) आ रहे थे. यहाँ `any` से cast करके runtime
   * shape-check करते हैं, जो असल behavior है.
   * =========================
   */
  const pending = useMemo(() => {
    const raw: any = pendingRaw;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.items && Array.isArray(raw.items)) return raw.items;
    return [];
  }, [pendingRaw]);

  const history = useMemo(() => {
    const raw: any = historyRaw;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.items && Array.isArray(raw.items)) return raw.items;
    return [];
  }, [historyRaw]);

  /**
   * =========================
   * CALENDAR GRID
   * =========================
   */
  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);

    const firstWeekday = start.getDay();
    const arr: Date[] = [];

    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (firstWeekday - i));
      arr.push(d);
    }

    for (let d = 1; d <= end.getDate(); d++) {
      arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }

    while (arr.length % 7 !== 0) {
      const last = arr[arr.length - 1];
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      arr.push(d);
    }

    return arr;
  }, [cursor]);

  const today = new Date();

  /**
   * =========================
   * DAY FILTER
   * =========================
   */
  const itemsForDay = (d: Date) => {
    const upcoming = pending.filter(
      (p: any) =>
        p.scheduledFor && sameDay(new Date(p.scheduledFor), d)
    );

    const done = history.filter(
      (p: any) =>
        p.postedAt && sameDay(new Date(p.postedAt), d)
    );

    return { upcoming, done };
  };

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Visualize your queue across the month. One post per day, automated."
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCursor(
                  new Date(
                    cursor.getFullYear(),
                    cursor.getMonth() - 1,
                    1
                  )
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[170px] text-center font-display text-sm font-semibold">
              {monthLabel}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCursor(
                  new Date(
                    cursor.getFullYear(),
                    cursor.getMonth() + 1,
                    1
                  )
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="secondary" onClick={() => setCursor(new Date())}>
              Today
            </Button>
          </div>
        }
      />

      <Card className="glass">
        <CardContent className="p-4">
          {/* Weekdays */}
          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              const isCur = d.getMonth() === cursor.getMonth();
              const isToday = sameDay(d, today);

              const { upcoming, done } = itemsForDay(d);
              const hasItems = upcoming.length + done.length > 0;

              return (
                <motion.button
                  key={i}
                  whileHover={{ y: -2 }}
                  onClick={() => setOpenDay(d)}
                  className={cn(
                    "relative flex aspect-square min-h-[78px] flex-col items-start rounded-xl border border-border/60 bg-background/40 p-2 text-left",
                    !isCur && "opacity-40",
                    isToday && "ring-2 ring-primary/70",
                    hasItems && "hover:border-primary/60"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday && "gradient-text font-bold"
                    )}
                  >
                    {d.getDate()}
                  </span>

                  <div className="mt-auto flex w-full flex-wrap gap-1">
                    {upcoming.slice(0, 2).map((p: any, idx: number) => (
                      <span
                        key={`up-${p.id ?? idx}`}
                        className="h-1.5 w-full rounded-full bg-primary/70"
                      />
                    ))}

                    {done.slice(0, 1).map((p: any, idx: number) => (
                      <span
                        key={`done-${p.id ?? idx}`}
                        className="h-1.5 w-full rounded-full bg-success/70"
                      />
                    ))}
                  </div>

                  {hasItems && (
                    <Badge
                      variant="outline"
                      className="absolute right-1 top-1 h-5 px-1.5 text-[10px]"
                    >
                      {upcoming.length + done.length}
                    </Badge>
                  )}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* =========================
          DAY DETAILS SHEET
          ========================= */}
      <Sheet open={!!openDay} onOpenChange={(o) => !o && setOpenDay(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {openDay?.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </SheetTitle>
            <SheetDescription>
              Posts scheduled or published on this day.
            </SheetDescription>
          </SheetHeader>

          {openDay && (
            <div className="mt-4 space-y-3">
              {[...itemsForDay(openDay).upcoming, ...itemsForDay(openDay).done].length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No posts on this day.
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}