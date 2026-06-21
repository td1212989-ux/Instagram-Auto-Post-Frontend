# API Contract — Instagram Auto Poster

OpenAPI-style reference for every endpoint the frontend calls.
All endpoint strings are defined in `src/constants/api.ts` and all
TypeScript interfaces live in `src/contracts/*`.

Base URL: `/api` (override with `VITE_API_URL` on the frontend).
Content-Type: `application/json` unless stated otherwise.
Auth: none (single-admin app; protect with network/IP allow-list at the edge).

Common error envelope (`ErrorResponse`):

```json
{ "ok": false, "message": "Human readable error", "code": "VALIDATION_ERROR", "errors": { "title": ["Required"] } }
```

Standard status codes used:
`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`,
`413 Payload Too Large`, `415 Unsupported Media Type`,
`422 Unprocessable Entity`, `429 Too Many Requests`, `500 Internal Server Error`.

---

## 1. GET `/api/dashboard`

- **Headers:** none
- **Body:** —
- **Success (200):** `DashboardStats`
- **Error:** `ErrorResponse`
- **Validation:** none
- **Status codes:** 200, 500

```json
{
  "pending": 18, "postedToday": 1, "totalUploaded": 42,
  "postedSuccessfully": 21, "failed": 3,
  "storageUsedGb": 4.2, "storageTotalGb": 25, "cloudinaryUsagePct": 38
}
```

## 2. GET `/api/dashboard/charts`

- **Success (200):** `GetDashboardChartsResponse`
- **Status codes:** 200, 500

## 3. GET `/api/posts/pending`

- **Success (200):** `Post[]` — only items with `status="pending"`, ordered by `position` ASC.
- **Status codes:** 200, 500

## 4. GET `/api/posts/history`

- **Success (200):** `Post[]` — items with `status` in `("posted","failed")`, ordered by `postedAt` DESC.
- **Status codes:** 200, 500

## 5. GET `/api/posts/:id`

- **Path params:** `id` (string)
- **Success (200):** `Post`
- **Status codes:** 200, 404, 500

## 6. POST `/api/posts/upload`

- **Headers:** `Content-Type: multipart/form-data`
- **Body (multipart):**
  - `files`: one or more image/video files (field repeats per file)
  - `posts`: JSON string `UploadItemPayload[]` aligned by index with `files`
- **Success (201):** `UploadResponse` `{ ok, count, created: Post[] }`
- **Validation:**
  - `files.length >= 1` and `<= 100`
  - Each `files[i].size <= 100 MB` (images), `<= 500 MB` (video)
  - `images`: `image/jpeg`, `image/png`, `image/webp`
  - `videos`: `video/mp4`, `video/quicktime`
  - `posts[i].title`: 1–120 chars, required
  - `posts[i].caption`: 1–2200 chars, required
  - `posts[i].type`: `"image" | "reel"` and must match file mime
- **Status codes:** 201, 400, 413, 415, 422, 500

## 7. PUT `/api/posts/:id`

- **Body:** `UpdatePostRequest` (any of `title`, `caption`, `scheduledFor`, `position`)
- **Success (200):** `UpdatePostResponse` (updated `Post`)
- **Validation:** same field rules as upload; `scheduledFor` must be a future ISO date.
- **Status codes:** 200, 400, 404, 422, 500

## 8. DELETE `/api/posts/:id`

- **Success (200):** `DeletePostResponse` `{ id, deleted: true }`
- **Side effects:** removes the Cloudinary asset if `status !== "posted"`.
- **Status codes:** 200, 404, 500

## 9. POST `/api/posts/post-now`

- **Body:** `{ "id": "string" }`
- **Success (200):** `PostNowResponse`
- **Validation:** post must exist and be `pending`.
- **Status codes:** 200, 404, 409 (already posted), 422, 500

## 10. GET `/api/settings`

- **Success (200):** `Settings`
- **Status codes:** 200, 500

## 11. PUT `/api/settings`

- **Body:** `UpdateSettingsRequest` (Partial<Settings>)
- **Validation:**
  - `dailyTime` matches `^\d{2}:\d{2}$`
  - `timezone` is a valid IANA zone
  - `queueMethod` ∈ `{"FIFO","Default"}`
- **Success (200):** `Settings`
- **Status codes:** 200, 422, 500

## 12. POST `/api/cron/run`

- **Headers:** `x-cron-secret: <CRON_SECRET>` (recommended)
- **Success (200):** `RunCronResponse`
- **Status codes:** 200, 401, 500

---

## TypeScript Reference

All interfaces are defined in:

- `src/contracts/post.contract.ts` — Post, PostType, PostStatus, request/response per endpoint
- `src/contracts/dashboard.contract.ts` — DashboardStats and chart point types
- `src/contracts/settings.contract.ts` — Settings, QueueMethod, cron run
- `src/contracts/upload.contract.ts` — UploadPayload, UploadResponse
- `src/contracts/response.contract.ts` — SuccessResponse, ErrorResponse, ApiResult
- `src/contracts/pagination.contract.ts` — PaginationQuery, PaginationMeta, PaginatedResponse
