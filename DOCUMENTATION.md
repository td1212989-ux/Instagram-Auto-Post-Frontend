# Instagram Auto Poster — Frontend Technical Documentation

> Complete developer & backend-integration guide for the existing React + Vite + TypeScript frontend.
> **No frontend code has been modified.** This document describes what already exists and what a Node.js + Express backend must provide to make it fully functional.

---

## 1. Complete Folder Structure

```
.
├── .lovable/                       # Lovable platform metadata (ignore)
├── components.json                 # shadcn/ui generator config
├── eslint.config.js                # ESLint configuration
├── package.json                    # Dependencies & scripts
├── bun.lock                        # Lockfile (Bun)
├── bunfig.toml                     # Bun runtime config
├── tsconfig.json                   # TypeScript config (strict)
├── vite.config.ts                  # Vite + TanStack Start plugin
├── AGENTS.md / .prettierrc / .prettierignore
└── src/
    ├── routeTree.gen.ts            # AUTO-GENERATED route tree (do not edit)
    ├── router.tsx                  # TanStack Router factory + QueryClient
    ├── server.ts                   # SSR entry (Cloudflare worker)
    ├── start.ts                    # TanStack Start bootstrap
    ├── styles.css                  # Tailwind v4 tokens + glassmorphism utilities
    │
    ├── routes/                     # File-based routes (PAGES)
    │   ├── __root.tsx              # Root layout: sidebar + topnav + <Outlet/>
    │   ├── index.tsx               # /            → Dashboard
    │   ├── upload.tsx              # /upload      → Upload page
    │   ├── queue.tsx               # /queue       → Pending posts queue
    │   ├── history.tsx             # /history     → Posted history
    │   ├── calendar.tsx            # /calendar    → Monthly calendar view
    │   ├── settings.tsx            # /settings    → Posting settings form
    │   └── README.md
    │
    ├── components/
    │   ├── layout/                 # App chrome
    │   │   ├── AppSidebar.tsx      # Left navigation sidebar
    │   │   ├── TopNav.tsx          # Top bar with title / actions
    │   │   └── PageHeader.tsx      # Per-page title + description + actions
    │   ├── common/                 # Cross-page primitives
    │   │   ├── StatCard.tsx        # Dashboard KPI tile
    │   │   └── EmptyState.tsx      # "No data" placeholder
    │   └── ui/                     # shadcn/ui primitives (Button, Card, Dialog, …)
    │
    ├── lib/
    │   ├── mock-data.ts            # ★ MOCK DATA — to be replaced by backend
    │   ├── utils.ts                # cn() Tailwind helper
    │   ├── error-capture.ts        # Lovable error capture (ignore)
    │   ├── error-page.ts           # Default error UI
    │   └── lovable-error-reporting.ts
    │
    ├── services/
    │   └── api.ts                  # ★ AXIOS instance + ALL service stubs (backend hook-points)
    │
    └── hooks/
        └── use-mobile.tsx          # Responsive helper
```

### Files most important for backend integration
| File | Why |
|---|---|
| `src/services/api.ts` | Single point of truth for every HTTP call. Switch from `delay(mockX)` to real `api.get/post/...` here. |
| `src/lib/mock-data.ts` | Contains the **response shapes** every endpoint must match. |
| `src/routes/*.tsx` | Show how each service is called (which mutations/queries trigger backend writes). |
| `vite.config.ts` | Where you may add a dev proxy to your Express server (e.g. `/api → http://localhost:4000`). |

---

## 2. Routes

| URL | File | Component | Purpose |
|---|---|---|---|
| `/` | `src/routes/index.tsx` | `DashboardPage` | KPIs, charts (uploads, pending vs posted, storage), recent activity |
| `/upload` | `src/routes/upload.tsx` | `UploadPage` | Drag/drop/paste/browse files, per-file title + caption, bulk upload |
| `/queue` | `src/routes/queue.tsx` | `QueuePage` | Pending posts table, edit/delete/post-now, search, filter, paginate |
| `/history` | `src/routes/history.tsx` | `HistoryPage` | Posted & failed history table |
| `/calendar` | `src/routes/calendar.tsx` | `CalendarPage` | Monthly grid of queued + posted items with day-detail Sheet |
| `/settings` | `src/routes/settings.tsx` | `SettingsPage` | Daily time, timezone, queue method form |

Root layout (`__root.tsx`) wraps every page with `AppSidebar` + `TopNav` + `<Outlet />`.

---

## 3. Components

### Layout
| Component | File | Used in |
|---|---|---|
| `AppSidebar` | `components/layout/AppSidebar.tsx` | `__root.tsx` (left nav across all pages) |
| `TopNav` | `components/layout/TopNav.tsx` | `__root.tsx` (top bar) |
| `PageHeader` | `components/layout/PageHeader.tsx` | Every page (title, description, action buttons) |

### Common
| Component | File | Used in |
|---|---|---|
| `StatCard` | `components/common/StatCard.tsx` | Dashboard KPI tiles |
| `EmptyState` | `components/common/EmptyState.tsx` | Queue, History, Calendar empty days |

### shadcn/ui primitives (in `components/ui/`)
`Button`, `Card`, `Dialog`, `AlertDialog`, `Sheet`, `Drawer`, `Input`, `Textarea`, `Label`, `Select`, `Table`, `Tabs`, `Badge`, `Progress`, `Tooltip`, `Sonner (toast)`, `Skeleton`, `ScrollArea`, `Calendar`, `Form`, `Sidebar`, `Avatar`, `Switch`, `Pagination`, `Popover`, `Separator`, `Carousel`, `Chart`, etc. — all standard shadcn components, reused across pages.

### Inline reusable patterns (not extracted, but present)
- File preview tile (image / video) — inside `upload.tsx`
- Queue table row, edit `Dialog`, delete `AlertDialog` — inside `queue.tsx`
- Calendar day cell + day-detail `Sheet` — inside `calendar.tsx`
- Recharts wrappers (Area, Bar, Pie) — inside `index.tsx`
- Toast notifications via `sonner` (mounted globally by shadcn `<Toaster/>`)

---

## 4. Services

All services live in **`src/services/api.ts`**. A single Axios instance is exported with `baseURL: "/api"` and 15-second timeout.

```ts
export const api = axios.create({ baseURL: "/api", timeout: 15000, headers: { "Content-Type": "application/json" } });
```

| Service | Function | Method | Expected Endpoint | Purpose |
|---|---|---|---|---|
| `DashboardService` | `get()` | GET | `/api/dashboard` | Returns `mockStats`-shaped object for KPIs/charts |
| `PostsService` | `pending()` | GET | `/api/posts/pending` | List of all pending (queued) posts |
| `PostsService` | `history()` | GET | `/api/posts/history` | List of all posted/failed posts |
| `PostsService` | `get(id)` | GET | `/api/posts/:id` | Single post by id |
| `PostsService` | `upload(formData)` | POST | `/api/posts/upload` | Multipart upload — files + JSON post metadata |
| `PostsService` | `update(id, patch)` | PUT | `/api/posts/:id` | Edit title/caption/etc. |
| `PostsService` | `remove(id)` | DELETE | `/api/posts/:id` | Delete from queue (and Cloudinary) |
| `PostsService` | `postNow(id)` | POST | `/api/posts/post-now` | Immediately publish a queued post |
| `SettingsService` | `get()` | GET | `/api/settings` | Get current admin settings |
| `SettingsService` | `update(patch)` | PUT | `/api/settings` | Save settings |
| `CronService` | `run()` | POST | `/api/cron/run` | Manually trigger the daily cron |

> Each function currently returns `delay(mockData)` — replace the body with the real `api.get/post/put/delete` call when wiring backend.

---

## 5. API Mapping (Page → Service → Endpoint)

| Page | Component | Service Function | HTTP | Endpoint | Request Body | Response |
|---|---|---|---|---|---|---|
| `/` | `DashboardPage` | `DashboardService.get` | GET | `/api/dashboard` | — | `DashboardStats` JSON |
| `/upload` | `UploadPage` | `PostsService.upload` | POST | `/api/posts/upload` | `FormData { files[], posts:JSON }` | `{ ok:true, count:number }` |
| `/queue` | `QueuePage` | `PostsService.pending` | GET | `/api/posts/pending` | — | `Post[]` |
| `/queue` | `QueuePage` (Edit dialog) | `PostsService.update` | PUT | `/api/posts/:id` | `Partial<Post>` | Updated `Post` |
| `/queue` | `QueuePage` (Delete) | `PostsService.remove` | DELETE | `/api/posts/:id` | — | `{ id, deleted:true }` |
| `/queue` | `QueuePage` (Post Now) | `PostsService.postNow` | POST | `/api/posts/post-now` | `{ id }` | `{ id, posted:true }` |
| `/history` | `HistoryPage` | `PostsService.history` | GET | `/api/posts/history` | — | `Post[]` |
| `/calendar` | `CalendarPage` | `PostsService.pending` + `.history` | GET | `/api/posts/pending`, `/api/posts/history` | — | `Post[]`, `Post[]` |
| `/settings` | `SettingsPage` | `SettingsService.get` | GET | `/api/settings` | — | `Settings` |
| `/settings` | `SettingsPage` (Save) | `SettingsService.update` | PUT | `/api/settings` | `Partial<Settings>` | `Settings` |
| (any) | manual trigger | `CronService.run` | POST | `/api/cron/run` | — | `{ ok:true }` |

---

## 6. Forms

### A. Upload Form — `src/routes/upload.tsx`
| Field | Type | Required | Validation |
|---|---|---|---|
| `files` | `File[]` (image/video) | ✓ | At least 1 file; accepts `image/*,video/*` |
| `title` (per file) | string | ✓ | Non-empty, max 120 chars |
| `caption` (per file) | string | ✓ | Non-empty, max 2200 chars; hashtag count shown |

Backend payload (multipart):
```
files:    [File, File, ...]
posts:    JSON.stringify([{ title, caption, type:"image"|"reel" }, ...])
```

### B. Edit Post Form — `src/routes/queue.tsx` (Dialog)
| Field | Type | Required |
|---|---|---|
| `title` | string | ✓ |
| `caption` | string | ✓ |

PUT body: `{ title, caption }`.

### C. Settings Form — `src/routes/settings.tsx` (react-hook-form + zod)
```ts
z.object({
  dailyTime:   z.string().regex(/^\d{2}:\d{2}$/),   // "HH:MM"
  timezone:    z.string().min(1),                    // IANA tz
  queueMethod: z.enum(["FIFO", "Default"]),
});
```
All fields required. PUT body matches the schema 1:1.

---

## 7. State Management

| Concern | Tool | Where |
|---|---|---|
| Server cache & data fetching | **TanStack Query** (`useQuery`, `useMutation`, `useQueryClient`) | Every page that talks to API |
| Form state + validation | **react-hook-form** + **zod** | `/settings` |
| Local UI state (filters, pagination, dialogs, drag-over) | `useState` / `useMemo` | `/queue`, `/history`, `/upload`, `/calendar` |
| Toast notifications | **sonner** (`toast.success/error`) | Global, mounted in root |
| Routing context | **TanStack Router** (file-based) | `__root.tsx` → child routes |
| Global state | **None** (no Redux/Zustand/Context). All shared state goes through TanStack Query cache. | — |

Query keys used: `["dashboard"]`, `["pending"]`, `["history"]`, `["settings"]`. After mutations, the corresponding key is invalidated.

---

## 8. TypeScript Types

Declared in `src/lib/mock-data.ts`. Backend responses MUST match these shapes.

```ts
export type PostType   = "image" | "reel";
export type PostStatus = "pending" | "posted" | "failed" | "scheduled";

export interface Post {
  id: string;
  title: string;
  caption: string;
  type: PostType;
  status: PostStatus;
  thumbnail: string;            // URL (Cloudinary)
  createdAt: string;            // ISO 8601
  scheduledFor?: string;        // ISO 8601
  postedAt?: string;            // ISO 8601
  position?: number;            // queue order
  sizeMb?: number;
}

// Dashboard response shape (mockStats)
interface DashboardStats {
  pending: number;
  postedToday: number;
  totalUploaded: number;
  postedSuccessfully: number;
  failed: number;
  storageUsedGb: number;
  storageTotalGb: number;
  cloudinaryUsagePct: number;
}

// Settings response shape (mockSettings)
interface Settings {
  dailyTime: string;            // "HH:MM"
  timezone: string;             // IANA, e.g. "Asia/Karachi"
  queueMethod: "FIFO" | "Default";
}
```

Auxiliary chart-only shapes used by the dashboard: `weeklyUploads`, `pendingVsPosted`, `imagesVsReels`, `storageSeries`, `recentActivity` — they SHOULD be derived server-side and returned **inside** `/api/dashboard` (recommended extension: extend `DashboardStats` to include `weeklyUploads`, `storageSeries`, `recentActivity`).

---

## 9. Mock Data

Single file: **`src/lib/mock-data.ts`**.

| Export | Replaced by |
|---|---|
| `mockPending` | `GET /api/posts/pending` |
| `mockHistory` | `GET /api/posts/history` |
| `mockStats` | `GET /api/dashboard` |
| `mockSettings` | `GET /api/settings` |
| `weeklyUploads`, `pendingVsPosted`, `imagesVsReels`, `storageSeries`, `recentActivity` | Returned as part of `GET /api/dashboard` |

To remove mocks: edit `src/services/api.ts` and swap each `delay(mockX)` for the real `api.get/post(...)` call.

---

## 10. Environment Variables

The frontend currently relies on Axios `baseURL: "/api"`. For real deployment add:

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` | Override Axios baseURL (recommended addition in `services/api.ts`) |

Backend `.env` (suggested, not part of frontend):
```
PORT=4000
MONGODB_URI=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
INSTAGRAM_ACCESS_TOKEN=...
INSTAGRAM_BUSINESS_ID=...
CRON_SECRET=...
```

Dev wiring options:
1. Add a Vite proxy in `vite.config.ts`: `server: { proxy: { "/api": "http://localhost:4000" } }`.
2. Or set `VITE_API_URL` and update `axios.create({ baseURL: import.meta.env.VITE_API_URL })`.

---

## 11. Backend Integration Guide (per page)

### `/` Dashboard
- **API:** `GET /api/dashboard`
- **When:** On mount (TanStack Query, key `["dashboard"]`)
- **Request:** none
- **Response:** `DashboardStats` (extend with `weeklyUploads`, `storageSeries`, `recentActivity` arrays)
- **Loading:** skeletons / muted text
- **Success:** charts + StatCards render
- **Error:** silent (currently); recommend toast

### `/upload`
- **API:** `POST /api/posts/upload` (multipart)
- **When:** User clicks **Upload** after all files have title+caption
- **Request:** `FormData { files[], posts: JSON string of [{title,caption,type}] }`
- **Response:** `{ ok:true, count:number }`
- **Loading:** per-file progress bar 0→100, button disabled
- **Success:** toast `"N posts added to queue"`, file list cleared
- **Error:** toast `"Upload failed"`

### `/queue`
- **APIs:**
  - `GET /api/posts/pending` (list)
  - `PUT /api/posts/:id` (edit)
  - `DELETE /api/posts/:id` (remove)
  - `POST /api/posts/post-now` body `{id}` (publish immediately)
- **When:** Mount + after every mutation (invalidates `["pending"]`)
- **Loading:** "Loading…" text
- **Success:** toast per action; table refreshes
- **Empty:** `EmptyState` rendered

### `/history`
- **API:** `GET /api/posts/history`
- **When:** On mount, key `["history"]`
- **Response:** `Post[]` with `status: "posted" | "failed"` and `postedAt`

### `/calendar`
- **APIs:** `GET /api/posts/pending` + `GET /api/posts/history` (parallel)
- **Used to:** group posts by date (`scheduledFor` for pending, `postedAt` for history)

### `/settings`
- **APIs:** `GET /api/settings`, `PUT /api/settings`
- **Validation:** zod schema (HH:MM, non-empty timezone, enum queue method)
- **Success:** toast `"Settings saved"`, query `["settings"]` invalidated
- **Error response should be JSON:** `{ message: string }` so the toast can surface it (recommend wrapping mutations with `onError`)

---

## 12. Backend Checklist

### Infrastructure
- [ ] Node.js 20+ / Express 4 server
- [ ] MongoDB (Atlas) — collections: `posts`, `settings`, `activity`
- [ ] Cloudinary account — for image & video storage
- [ ] Instagram Graph API — Business/Creator account + long-lived access token
- [ ] Cron runner — `node-cron` in-process **or** external scheduler hitting `/api/cron/run`

### Endpoints (frontend already calls these)
- [ ] `GET  /api/dashboard`
- [ ] `GET  /api/posts/pending`
- [ ] `GET  /api/posts/history`
- [ ] `GET  /api/posts/:id`
- [ ] `POST /api/posts/upload` (multer for multipart)
- [ ] `PUT  /api/posts/:id`
- [ ] `DELETE /api/posts/:id` (also delete asset on Cloudinary)
- [ ] `POST /api/posts/post-now`
- [ ] `GET  /api/settings`
- [ ] `PUT  /api/settings`
- [ ] `POST /api/cron/run`

### Cross-cutting
- [ ] CORS for the frontend origin
- [ ] Request validation (zod / joi) mirroring the shapes in §8
- [ ] Error envelope: `{ message: string, code?: string }`
- [ ] Logging on Instagram publish (success/failure → `activity` collection)
- [ ] Auto-delete Cloudinary asset + Mongo doc after successful Instagram post
- [ ] Token-refresh handling for Instagram long-lived token

---

## 13. Final API Contract

All endpoints prefixed `/api`. JSON unless noted. No auth headers required by the frontend (single-admin local use).

### GET `/api/dashboard`
- **Response 200:**
  ```json
  {
    "pending": 18,
    "postedToday": 1,
    "totalUploaded": 42,
    "postedSuccessfully": 21,
    "failed": 3,
    "storageUsedGb": 4.2,
    "storageTotalGb": 25,
    "cloudinaryUsagePct": 38,
    "weeklyUploads":   [{ "day":"Mon", "uploads":8, "posted":1 }, ...],
    "storageSeries":   [{ "month":"Jan", "gb":1.2 }, ...],
    "recentActivity":  [{ "id":1, "text":"...", "time":"2h ago", "kind":"success" }]
  }
  ```

### GET `/api/posts/pending` &nbsp;·&nbsp; GET `/api/posts/history`
- **Response 200:** `Post[]` (see §8)

### GET `/api/posts/:id`
- **200:** `Post` &nbsp;·&nbsp; **404:** `{ "message":"Post not found" }`

### POST `/api/posts/upload`
- **Headers:** `Content-Type: multipart/form-data`
- **Body fields:**
  - `files`: one or more `File` parts
  - `posts`: stringified JSON array `[{ "title":string, "caption":string, "type":"image"|"reel" }]` (same order/length as files)
- **Validation:**
  - `files.length === posts.length`
  - title 1–120 chars, caption 1–2200 chars, type ∈ {image, reel}
  - mime: `image/*` or `video/*`
- **200:** `{ "ok": true, "count": number, "ids": string[] }`
- **400:** `{ "message": "Validation failed", "errors": [...] }`
- **413:** payload too large

### PUT `/api/posts/:id`
- **Body:** `{ "title"?: string, "caption"?: string }` (and any future editable field)
- **200:** Updated `Post` &nbsp;·&nbsp; **404 / 400** as above

### DELETE `/api/posts/:id`
- **200:** `{ "id": string, "deleted": true }`
- Must also remove Cloudinary asset.

### POST `/api/posts/post-now`
- **Body:** `{ "id": string }`
- **200:** `{ "id": string, "posted": true, "instagramMediaId": "…" }`
- **502:** `{ "message": "Instagram publish failed", "details": "…" }`

### GET `/api/settings`
- **200:** `{ "dailyTime":"10:00", "timezone":"Asia/Karachi", "queueMethod":"FIFO" }`

### PUT `/api/settings`
- **Body:** Same shape as above (partial allowed)
- **Validation:** `dailyTime` `/^\d{2}:\d{2}$/`, `timezone` valid IANA, `queueMethod ∈ {FIFO, Default}`
- **200:** Full updated `Settings`

### POST `/api/cron/run`
- **Auth:** internal secret header (e.g. `x-cron-secret`) if exposed publicly
- **200:** `{ "ok": true, "postedId": "…" | null }`

### Standard status codes
`200` OK · `400` Validation · `404` Not Found · `413` Payload Too Large · `500` Server Error · `502` Instagram Error.

---

## 14. Data Flow

```
[Upload Page]
   │  user drops files + writes title/caption
   ▼
Frontend validation (title & caption non-empty)
   │
   ▼
POST /api/posts/upload   (multipart: files + posts JSON)
   │
   ▼
Express (multer)
   │
   ├──► Cloudinary upload  →  returns secure_url
   │
   └──► MongoDB insert     →  { title, caption, type, thumbnail:url, status:"pending", createdAt, position }
   │
   ▼
GET /api/posts/pending     ◄── Queue page reads list
GET /api/dashboard         ◄── Dashboard reads counts/charts

[Cron — daily at settings.dailyTime in settings.timezone]
   │
   ▼
Pick next post (FIFO or Default order)
   │
   ▼
Instagram Graph API:  create container → publish
   │
   ├── success → status:"posted", postedAt, write activity log
   │            → DELETE Cloudinary asset
   │            → (option) DELETE / archive Mongo doc to history collection
   │
   └── failure → status:"failed", write activity log with error
   │
   ▼
GET /api/posts/history     ◄── History page reads results
GET /api/posts/pending     ◄── Queue refreshes
GET /api/dashboard         ◄── KPIs update
```

Manual trigger (`Post Now` button) follows the same publish path but is invoked by `POST /api/posts/post-now` instead of cron.

---

## 15. Final Integration Notes

To connect a Node.js + Express backend without touching any frontend code:

1. **Match the contract in §13 exactly.** All response field names, types, and shapes must equal those in `src/lib/mock-data.ts`. Any drift will break the UI silently.
2. **Base URL.** The Axios instance uses `baseURL: "/api"`. Either:
   - serve the backend on the same origin (mount Express at `/api`), or
   - add a Vite dev proxy: `server.proxy = { "/api": "http://localhost:4000" }` in `vite.config.ts`, or
   - read `import.meta.env.VITE_API_URL` and create `axios.create({ baseURL: env || "/api" })`.
3. **Switching off mocks.** In `src/services/api.ts`, replace each `delay(mockX)` body with the real call, e.g.:
   ```ts
   pending: () => api.get<Post[]>("/posts/pending").then(r => r.data),
   upload:  (formData) => api.post("/posts/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data),
   ```
   Do **not** rename any exported function — pages import them by name.
4. **CORS.** Allow the dev origin (`http://localhost:5173` or whichever Vite uses) and the deployed origin.
5. **Multipart uploads.** Backend must accept `files` (multiple) + a string `posts` field; parse the JSON, validate, then loop-upload to Cloudinary and insert to Mongo in the same order.
6. **Cloudinary cleanup.** On both `DELETE /api/posts/:id` and after a successful Instagram publish, delete the asset by public_id.
7. **Settings drive cron.** Read `dailyTime` + `timezone` and re-arm the cron whenever `PUT /api/settings` succeeds.
8. **Errors.** Always return JSON `{ message }` — the frontend uses `toast.error(...)` and expects a readable string.
9. **No auth in the frontend.** Do not require auth headers; if you must protect the backend, terminate auth at the reverse proxy or add an internal-only token.
10. **Extensions are safe.** You may return extra fields on any object; the frontend ignores unknown properties.

> Frontend is feature-complete and ready. Implement §13 verbatim and the entire app will go live without a single UI change.
