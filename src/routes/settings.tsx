import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import {
  Clock,
  Globe,
  ListOrdered,
  Save,
  RotateCcw,
  CalendarClock,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { SettingsService, PostsService } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Instagram Auto Poster" }],
  }),
  component: SettingsPage,
});

type Settings = {
  dailyTime: string;
  timezone: string;
  queueMethod: "FIFO" | "Default";
};

type Post = {
  id: string;
  title: string;
  thumbnail: string;
  scheduledFor?: string;
};

const schema = z.object({
  dailyTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  timezone: z.string().min(1),
  queueMethod: z.enum(["FIFO", "Default"]),
});

type FormValues = z.infer<typeof schema>;

const TIMEZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

/**
 * =========================
 * 12-HOUR <-> 24-HOUR HELPERS
 * =========================
 * Backend/Cron hamesha 24h "HH:mm" string use karte hain
 * (matching karna easy hota hai). Yahan sirf UI ke liye
 * 12h AM/PM me convert/display karte hain.
 */
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
); // "00".."59"

const to12Hour = (time24: string) => {
  const [hStr, mStr] = (time24 || "10:00").split(":");
  const h = parseInt(hStr, 10) || 0;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: mStr ?? "00", period };
};

const to24Hour = (hour12: number, minute: string, period: "AM" | "PM") => {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

const displayTime12 = (time24: string) => {
  const { hour, minute, period } = to12Hour(time24);
  return `${hour}:${minute} ${period}`;
};

function SettingsPage() {
  const qc = useQueryClient();

  const { data: settingsRaw } = useQuery({
    queryKey: ["settings"],
    queryFn: SettingsService.get,
  });

  const { data: pendingPostsRaw } = useQuery({
    queryKey: ["pending"],
    queryFn: PostsService.pending,
  });

  const pendingPosts: Post[] = Array.isArray(pendingPostsRaw)
    ? pendingPostsRaw
    : [];

  const next = pendingPosts?.[0] ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dailyTime: "10:00",
      timezone: "UTC",
      queueMethod: "FIFO",
    },
  });

  useEffect(() => {
    if (settingsRaw) form.reset(settingsRaw as Settings);
  }, [settingsRaw, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) => SettingsService.update(v),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const values = form.watch();
  const time12 = to12Hour(values.dailyTime);

  const updateTime = (
    hour: number,
    minute: string,
    period: "AM" | "PM"
  ) => {
    form.setValue("dailyTime", to24Hour(hour, minute, period), {
      shouldDirty: true,
    });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your daily posting schedule and queue strategy."
      />

      <form
        onSubmit={form.handleSubmit((v) => save.mutate(v))}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* LEFT */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>Posting</CardTitle>
            <CardDescription>
              One post per day, exactly when you want it.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {/* TIME — 12-HOUR AM/PM PICKER */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Daily posting time
                </Label>

                <div className="flex gap-2">
                  {/* HOUR */}
                  <Select
                    value={String(time12.hour)}
                    onValueChange={(v) =>
                      updateTime(Number(v), time12.minute, time12.period)
                    }
                  >
                    <SelectTrigger className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS_12.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* MINUTE */}
                  <Select
                    value={time12.minute}
                    onValueChange={(v) =>
                      updateTime(time12.hour, v, time12.period)
                    }
                  >
                    <SelectTrigger className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* AM / PM */}
                  <Select
                    value={time12.period}
                    onValueChange={(v: "AM" | "PM") =>
                      updateTime(time12.hour, time12.minute, v)
                    }
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.formState.errors.dailyTime && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dailyTime.message}
                  </p>
                )}
              </div>

              {/* TIMEZONE */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Timezone
                </Label>

                <Select
                  value={values.timezone}
                  onValueChange={(v) =>
                    form.setValue("timezone", v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {TIMEZONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* QUEUE METHOD */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4" /> Queue method
              </Label>

              <Select
                value={values.queueMethod}
                onValueChange={(v: "FIFO" | "Default") =>
                  form.setValue("queueMethod", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className="md:w-1/2">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="FIFO">
                    FIFO — First In First Out
                  </SelectItem>
                  <SelectItem value="Default">
                    Default — Manual ordering
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => settingsRaw && form.reset(settingsRaw as Settings)}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>

              <Button
                type="submit"
                disabled={save.isPending}
                className="bg-[image:var(--gradient-primary)] text-primary-foreground"
              >
                <Save className="mr-2 h-4 w-4" />
                {save.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Current Schedule
            </CardTitle>
            <CardDescription>What will happen next.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase text-muted-foreground">
                Daily time
              </div>

              <div className="mt-1 text-2xl font-semibold">
                {displayTime12(values.dailyTime)}
              </div>

              <Badge className="mt-2" variant="outline">
                {values.timezone}
              </Badge>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="text-xs uppercase text-muted-foreground">
                Next scheduled post
              </div>

              {next ? (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={next.thumbnail}
                    alt={next.title}
                    className="h-12 w-12 rounded-lg object-cover"
                  />

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {next.title}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {values.dailyTime
                        ? `Aaj ${displayTime12(values.dailyTime)} (${
                            values.timezone || "Asia/Kolkata"
                          }) auto-post hoga`
                        : "Not scheduled"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  No queued posts.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}