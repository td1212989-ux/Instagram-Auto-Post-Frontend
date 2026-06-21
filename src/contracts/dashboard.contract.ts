// Dashboard contracts.

export interface DashboardStats {
  pending: number;
  postedToday: number;
  totalUploaded: number;
  postedSuccessfully: number;
  failed: number;
  storageUsedGb: number;
  storageTotalGb: number;
  /** 0-100 percentage of monthly Cloudinary quota. */
  cloudinaryUsagePct: number;
}

export interface WeeklyUploadPoint {
  day: string; // "Mon" .. "Sun"
  uploads: number;
  posted: number;
}

export interface StatusDistributionPoint {
  name: "Pending" | "Posted" | "Failed";
  value: number;
}

export interface ContentMixPoint {
  name: "Images" | "Reels";
  value: number;
}

export interface StorageSeriesPoint {
  month: string; // "Jan" .. "Dec"
  gb: number;
}

export type ActivityKind = "success" | "info" | "error";

export interface ActivityItem {
  id: number | string;
  text: string;
  /** Human-readable relative time, e.g. "2h ago". */
  time: string;
  kind: ActivityKind;
}

// ------------------------------------------------------------
// GET /api/dashboard
// ------------------------------------------------------------
export type GetDashboardRequest = void;
export type GetDashboardResponse = DashboardStats;

// ------------------------------------------------------------
// GET /api/dashboard/charts (optional grouping)
// ------------------------------------------------------------
export interface GetDashboardChartsResponse {
  weeklyUploads: WeeklyUploadPoint[];
  pendingVsPosted: StatusDistributionPoint[];
  imagesVsReels: ContentMixPoint[];
  storageSeries: StorageSeriesPoint[];
  recentActivity: ActivityItem[];
}
