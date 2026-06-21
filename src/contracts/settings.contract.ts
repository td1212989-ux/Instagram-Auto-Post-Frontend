// Settings contracts.

export type QueueMethod = "FIFO" | "Default";

export interface Settings {
  /** "HH:MM" 24-hour format. */
  dailyTime: string;
  /** IANA timezone, e.g. "Asia/Karachi". */
  timezone: string;
  queueMethod: QueueMethod;
}

// ------------------------------------------------------------
// GET /api/settings
// ------------------------------------------------------------
export type GetSettingsRequest = void;
export type GetSettingsResponse = Settings;

// ------------------------------------------------------------
// PUT /api/settings
// ------------------------------------------------------------
export type UpdateSettingsRequest = Partial<Settings>;
export type UpdateSettingsResponse = Settings;

// ------------------------------------------------------------
// POST /api/cron/run (manual trigger of the daily cron)
// ------------------------------------------------------------
export type RunCronRequest = void;
export interface RunCronResponse {
  ok: true;
  ranAt: string;
  postedId?: string;
}
