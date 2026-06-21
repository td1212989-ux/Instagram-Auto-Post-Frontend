import axios, { type AxiosInstance } from "axios";
import { API } from "@/constants/api";

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  timeout: 20000,
});

/**
 * =========================
 * SHARED TYPES
 * =========================
 */
export interface Post {
  id: string;
  title: string;
  caption?: string;
  thumbnail?: string;
  type?: "reel" | "post";
  status?: "pending" | "posted" | "failed";
  scheduledFor?: string;
  postedAt?: string;
}

export interface DashboardStats {
  postedSuccessfully: number;
  failed: number;
  pending: number;
  [key: string]: any;
}

export interface Settings {
  dailyTime: string;
  timezone: string;
  queueMethod: "FIFO" | "Default";
}

/**
 * =========================
 * SAFE REQUEST WRAPPER
 * =========================
 */
const request = async <T>(promise: Promise<any>): Promise<T> => {
  try {
    const res = await promise;
    return unwrap<T>(res);
  } catch (err) {
    console.error("API ERROR:", err);
    throw err;
  }
};

/**
 * =========================
 * UNWRAP (ROBUST NORMALIZER)
 * =========================
 */
const unwrap = <T>(res: any): T => {
  const data = res?.data ?? res;

  return (data?.data ??
    data?.posts ??
    data?.result ??
    data) as T;
};

/**
 * =========================
 * NORMALIZE POST
 * =========================
 * Backend `_id` bhejta hai, frontend `id` use karta hai —
 * yahan ek hi jagah dono ko match kara dete hain taaki
 * poore app me `.id` hamesha sahi value de.
 */
const normalizePost = (p: any): Post => ({
  ...p,
  id: p?.id ?? p?._id,
});

/**
 * =========================
 * DASHBOARD
 * =========================
 */
export const DashboardService = {
  get: async (): Promise<DashboardStats> => {
    return request<DashboardStats>(api.get(API.dashboard));
  },
};

/**
 * =========================
 * POSTS
 * =========================
 */
export const PostsService = {
  pending: async (): Promise<Post[]> => {
    const data = await request<any[]>(api.get(API.pending));
    return (Array.isArray(data) ? data : []).map(normalizePost);
  },

  history: async (): Promise<Post[]> => {
    const data = await request<any[]>(api.get(API.history));
    return (Array.isArray(data) ? data : []).map(normalizePost);
  },

  get: async (id: string): Promise<Post> => {
    const data = await request<any>(api.get(API.postById(id)));
    return normalizePost(data);
  },

  upload: async (formData: FormData): Promise<Post> => {
    return request<Post>(
      api.post(API.upload, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  update: async (id: string, patch: Record<string, any>): Promise<Post> => {
    return request<Post>(api.put(API.postById(id), patch));
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(api.delete(API.postById(id)));
  },

  postNow: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(api.post(API.postNow, { id }));
  },
};

/**
 * =========================
 * SETTINGS
 * =========================
 */
export const SettingsService = {
  get: async (): Promise<Settings> => {
    return request<Settings>(api.get(API.settings));
  },

  update: async (patch: Partial<Settings>): Promise<Settings> => {
    return request<Settings>(api.put(API.settings, patch));
  },
};

/**
 * =========================
 * CRON
 * =========================
 */
export const CronService = {
  run: async (): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(api.post(API.cronRun));
  },
};