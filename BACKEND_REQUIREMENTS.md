# Backend Requirements — Instagram Auto Poster

A backend developer can build the full server from this document alone.
**Do not modify the frontend.** All request/response shapes are fixed by
`src/contracts/*` and all endpoints by `src/constants/api.ts`.

---

## 1. Stack

- Node.js 20+
- Express 4 (or Fastify) + TypeScript
- MongoDB 6 via Mongoose
- Cloudinary Node SDK
- node-cron (or BullMQ + Redis for production)
- multer for multipart uploads
- zod or joi for validation
- pino/winston for logging
- helmet, cors, express-rate-limit

## 2. Expected Folder Structure

```
backend/
├─ src/
│  ├─ index.ts                # app bootstrap
│  ├─ config/
│  │  ├─ env.ts               # env validation (zod)
│  │  ├─ db.ts                # mongoose connect
│  │  └─ cloudinary.ts        # cloudinary.config()
│  ├─ models/
│  │  ├─ Post.ts
│  │  └─ Settings.ts
│  ├─ routes/
│  │  ├─ dashboard.routes.ts
│  │  ├─ posts.routes.ts
│  │  ├─ settings.routes.ts
│  │  └─ cron.routes.ts
│  ├─ controllers/
│  │  ├─ dashboard.controller.ts
│  │  ├─ posts.controller.ts
│  │  ├─ settings.controller.ts
│  │  └─ cron.controller.ts
│  ├─ services/
│  │  ├─ cloudinary.service.ts
│  │  ├─ instagram.service.ts
│  │  ├─ queue.service.ts
│  │  └─ cron.service.ts
│  ├─ middleware/
│  │  ├─ error.ts
│  │  ├─ validate.ts
│  │  ├─ upload.ts             # multer config
│  │  └─ rateLimit.ts
│  ├─ utils/
│  │  ├─ logger.ts
│  │  └─ time.ts
│  └─ contracts/               # mirror frontend src/contracts (copy/paste)
├─ .env
├─ package.json
└─ tsconfig.json
```

## 3. Endpoints (mirror `src/constants/api.ts`)

| Method | Path                      | Purpose                          |
| ------ | ------------------------- | -------------------------------- |
| GET    | `/api/dashboard`          | Dashboard stats                  |
| GET    | `/api/dashboard/charts`   | Chart datasets (optional)        |
| GET    | `/api/posts/pending`      | Pending queue                    |
| GET    | `/api/posts/history`      | Posted / failed history          |
| GET    | `/api/posts/:id`          | Single post                      |
| POST   | `/api/posts/upload`       | Multipart upload to queue        |
| PUT    | `/api/posts/:id`          | Edit title/caption/position      |
| DELETE | `/api/posts/:id`          | Remove post (+ Cloudinary asset) |
| POST   | `/api/posts/post-now`     | Manually publish a queued post   |
| GET    | `/api/settings`           | Read settings                    |
| PUT    | `/api/settings`           | Update settings                  |
| POST   | `/api/cron/run`           | Manually trigger the daily job   |

See `src/contracts/API_CONTRACT.md` for payloads, responses, and status codes.

## 4. MongoDB Schemas

### `posts`

```ts
{
  _id: ObjectId,
  title: string,            // 1..120
  caption: string,          // 1..2200
  type: "image" | "reel",
  status: "pending" | "posted" | "failed" | "scheduled",
  thumbnail: string,        // Cloudinary secure_url
  cloudinaryPublicId: string,
  cloudinaryResourceType: "image" | "video",
  sizeMb: number,
  position: number,         // FIFO order; unique among status="pending"
  scheduledFor?: Date,
  postedAt?: Date,
  instagramMediaId?: string,
  errorMessage?: string,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes: `{status:1, position:1}`, `{status:1, postedAt:-1}`, `{createdAt:-1}`.

The HTTP layer must serialize `_id` → `id` and dates → ISO strings to match
the frontend `Post` contract.

### `settings`

Single document (`_id: "singleton"`):

```ts
{ _id: "singleton", dailyTime: "10:00", timezone: "Asia/Karachi", queueMethod: "FIFO" }
```

## 5. Cloudinary Flow

1. Upload received via multer (memory storage).
2. For each file → `cloudinary.uploader.upload_stream({ resource_type: "auto", folder: "ig-auto-poster" })`.
3. Persist `secure_url` (→ `thumbnail`), `public_id`, `resource_type`, `bytes/1024/1024` (→ `sizeMb`).
4. On delete or successful Instagram post, call `cloudinary.uploader.destroy(public_id, { resource_type })`.

## 6. Instagram Flow (Graph API v19+)

Required env: `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_ACCESS_TOKEN` (long-lived).

**Image post**
1. `POST /{ig-user-id}/media` with `image_url`, `caption` → container id
2. `POST /{ig-user-id}/media_publish` with `creation_id`

**Reel post**
1. `POST /{ig-user-id}/media` with `media_type=REELS`, `video_url`, `caption` → container id
2. Poll `GET /{container-id}?fields=status_code` until `FINISHED`
3. `POST /{ig-user-id}/media_publish` with `creation_id`

Refresh long-lived token every 50 days (`GET /refresh_access_token`).

## 7. Cron Flow

- Read `settings` once per boot and on every PUT.
- Schedule with `node-cron` using `dailyTime` + `timezone`.
- On tick:
  1. Pick next post: `findOne({status:"pending"}).sort(queueMethod === "FIFO" ? {position:1, createdAt:1} : {position:1})`.
  2. Call Instagram flow.
  3. On success → set `status="posted"`, `postedAt=now`, `instagramMediaId=...`, then destroy Cloudinary asset.
  4. On failure → set `status="failed"`, `errorMessage=...` (keep Cloudinary asset for retry).
  5. Reflow positions: decrement `position` of remaining pending docs.

Manual trigger: `POST /api/cron/run` runs the same routine once. Protect with `x-cron-secret` header.

## 8. Error Handling

- Central Express error middleware → always emits `ErrorResponse`:
  ```json
  { "ok": false, "message": "...", "code": "VALIDATION_ERROR", "errors": {...} }
  ```
- Map zod errors → `422` + `errors` map.
- Map Mongoose `CastError` / not-found → `404`.
- Map Instagram API failures → `502` with `code: "INSTAGRAM_ERROR"`.

## 9. Rate Limiting

- Global: 300 req / 15 min / IP.
- `POST /api/posts/upload`: 30 req / hour / IP.
- `POST /api/cron/run`: 10 req / hour / IP (in addition to `x-cron-secret`).

## 10. File Validation

| Rule              | Value                                                |
| ----------------- | ---------------------------------------------------- |
| Max files/request | 100                                                  |
| Max image size    | 100 MB (Instagram allows 8 MB but be permissive)     |
| Max video size    | 500 MB                                               |
| Image formats     | `image/jpeg`, `image/png`, `image/webp`              |
| Video formats     | `video/mp4`, `video/quicktime`                       |
| Aspect ratio      | 0.8 – 1.91 (enforced by Instagram, warn pre-upload)  |
| Reel duration     | 3 – 90 s                                             |

Rejected files → respond with `UploadValidationError`.

## 11. Queue Logic

- `position` is dense, 1-based, unique among pending posts.
- New uploads append at the tail (`max(position) + 1`).
- Edit `position` → re-pack other pending positions.
- Delete pending → re-pack positions.
- `queueMethod === "FIFO"` → cron picks lowest `position` (oldest first).
- `queueMethod === "Default"` → respect manual `position`, ties broken by `createdAt`.

## 12. Auto-Delete Flow

After a successful Instagram publish:
1. `cloudinary.uploader.destroy(public_id, { resource_type })`.
2. Keep the Mongo document (history); null out `cloudinaryPublicId`.
3. Failed posts retain their Cloudinary asset for 24h, then a sweeper removes them.

## 13. Deployment Notes

- **Render / Railway / Fly.io** are recommended (long-running cron supported).
- On **Vercel** (serverless) the cron must be an external pinger calling `POST /api/cron/run` with `x-cron-secret`.
- Configure CORS to allow the frontend origin only.
- Run behind HTTPS; trust proxy (`app.set('trust proxy', 1)`).
- Health endpoint: `GET /api/health` → `{ ok: true }`.
- Process manager: pm2 / Render native restart on crash.
