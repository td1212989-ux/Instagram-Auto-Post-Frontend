import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Database,
  Cloud,
  Image as ImageIcon,
  Calendar as CalIcon,
} from "lucide-react";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DashboardService, PostsService } from "@/services/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Instagram Auto Poster" },
      { name: "description", content: "Overview dashboard" },
    ],
  }),
  component: DashboardPage,
});

/**
 * =========================
 * TYPES (REAL BACKEND SAFE)
 * =========================
 */
type DashboardStats = {
  pending: number;
  postedToday: number;
  totalUploaded: number;
  postedSuccessfully: number;
  failed: number;
  storageUsedGb: number;
  storageTotalGb: number;
  cloudinaryUsagePct: number;
};

function DashboardPage() {
  /**
   * DASHBOARD API (REAL BACKEND SAFE)
   */
  const { data: statsRaw } = useQuery({
    queryKey: ["dashboard"],
    queryFn: DashboardService.get,
  });

  const stats: DashboardStats = {
    pending: (statsRaw as DashboardStats)?.pending ?? 0,
    postedToday: (statsRaw as DashboardStats)?.postedToday ?? 0,
    totalUploaded: (statsRaw as DashboardStats)?.totalUploaded ?? 0,
    postedSuccessfully: (statsRaw as DashboardStats)?.postedSuccessfully ?? 0,
    failed: (statsRaw as DashboardStats)?.failed ?? 0,
    storageUsedGb: (statsRaw as DashboardStats)?.storageUsedGb ?? 0,
    storageTotalGb: (statsRaw as DashboardStats)?.storageTotalGb ?? 1,
    cloudinaryUsagePct: (statsRaw as DashboardStats)?.cloudinaryUsagePct ?? 0,
  };

  /**
   * POSTS API (REAL ONLY)
   */
  const { data: pendingRaw } = useQuery({
    queryKey: ["pending"],
    queryFn: PostsService.pending,
  });

  const pending = Array.isArray(pendingRaw) ? pendingRaw : [];

  /**
   * NORMALIZE EACH POST (REAL MONGODB SAFE)
   * MongoDB documents `_id` देते हैं (`id` नहीं), और caption का
   * field shayad `caption` ho `title` nahi. यहाँ दोनों cases
   * handle किए हैं ताकि real backend data के साथ कुछ भी टूटे ना,
   * aur key हमेशा unique/defined रहे (warning fix).
   */
  const latest = pending.slice(0, 5).map((p: any, idx: number) => ({
    key: p._id ?? p.id ?? `post-${idx}`,
    thumbnail: p.thumbnail ?? p.mediaUrl ?? p.imageUrl ?? "",
    title: p.title ?? p.caption ?? "Untitled",
    type: p.type ?? "post",
    position: p.position ?? idx + 1,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your Instagram automation system"
      />

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Pending" value={stats.pending} icon={Clock} />
        <StatCard label="Today" value={stats.postedToday} icon={CalIcon} />
        <StatCard label="Uploaded" value={stats.totalUploaded} icon={UploadCloud} />
        <StatCard label="Posted" value={stats.postedSuccessfully} icon={CheckCircle2} />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} />
        <StatCard label="Storage" value={`${stats.storageUsedGb} GB`} icon={Database} />
      </div>

      {/* STORAGE PROGRESS */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent>
            <Progress value={(stats.storageUsedGb / stats.storageTotalGb) * 100} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent>
            <Progress value={stats.cloudinaryUsagePct} />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent>
            <Progress value={(stats.postedSuccessfully / (stats.totalUploaded || 1)) * 100} />
          </CardContent>
        </Card>
      </div>

      {/* LATEST POSTS TABLE */}
      <div className="mt-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Latest Uploads</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {latest.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      No posts uploaded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  latest.map((p) => (
                    <TableRow key={p.key}>
                      <TableCell>
                        {p.thumbnail ? (
                          <img src={p.thumbnail} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>
                        <Badge>{p.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">#{p.position}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}