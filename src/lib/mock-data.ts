/**
 * =========================
 * MOCK DATA (SAFE FALLBACK ONLY)
 * =========================
 */

export const IS_MOCK_ENABLED = false;

// Export the interface so it can be used in your components
export interface Post {
  id: string;
  title: string;
  caption: string;
  thumbnail: string;
  type: 'reel' | 'post';
  status: 'posted' | 'failed';
  postedAt: string;
}

/**
 * NOTE:
 * UI अब API + SOCKET data use करेगा
 * mock-data सिर्फ fallback रहेगा
 */

// =========================
// Fallback: pending posts queue
// Used by TopNav (and other components) when API/socket
// data hasn't loaded yet, so the UI never crashes.
// =========================
export const mockPending: Post[] = [
  {
    id: "mock-1",
    title: "Sample Reel",
    caption: "This is a placeholder pending post.",
    thumbnail: "",
    type: "reel",
    status: "posted",
    postedAt: new Date().toISOString(),
  },
];

// =========================
// Fallback: dashboard stats
// =========================
export interface Stats {
  postedSuccessfully: number;
  failed: number;
  pending: number;
}

export const mockStats: Stats = {
  postedSuccessfully: 0,
  failed: 0,
  pending: mockPending.length,
};