# Environment Variables

## Frontend (`.env` in project root)

| Key            | Example                          | Notes                                   |
| -------------- | -------------------------------- | --------------------------------------- |
| `VITE_API_URL` | `https://api.example.com/api`    | Optional. Defaults to `/api` (proxied). |

Vite only exposes variables prefixed with `VITE_`.

## Backend (`backend/.env`)

```env
# Server
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app

# Mongo
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ig-auto-poster

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
CLOUDINARY_UPLOAD_FOLDER=ig-auto-poster

# Instagram Graph API
INSTAGRAM_BUSINESS_ACCOUNT_ID=178414xxxxxxxxxx
INSTAGRAM_ACCESS_TOKEN=EAAG...long-lived-token
INSTAGRAM_APP_ID=xxxx
INSTAGRAM_APP_SECRET=xxxx

# Cron
CRON_SECRET=replace-with-a-long-random-string
DEFAULT_TIMEZONE=Asia/Karachi
DEFAULT_DAILY_TIME=10:00
```

## Render (backend host)

Set the same backend `.env` keys in the Render dashboard → Environment.
Add a **Persistent Cron Job** (Render Cron) or rely on in-process `node-cron`.

## Vercel (frontend host)

| Key            | Value                              |
| -------------- | ---------------------------------- |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |

If frontend and backend share a domain, omit this and proxy `/api/*`
through `vercel.json` rewrites.

## Cloudinary

Create an unsigned upload preset is **not** required — uploads go server-side
using the API key/secret above.

## MongoDB

Create a database user with `readWrite` on the `ig-auto-poster` database.
Whitelist the backend host IP (or `0.0.0.0/0` for Render dynamic IPs).

## Instagram

Requirements:
1. Facebook Page connected to an Instagram Business / Creator account.
2. A Facebook App in Developer Mode with **Instagram Graph API** enabled.
3. Generate a **long-lived user token** (60 days) and exchange for an
   IG Business Account scoped token.
4. Refresh the token every ≤ 50 days via `GET /refresh_access_token`.

Required scopes: `instagram_basic`, `instagram_content_publish`,
`pages_show_list`, `pages_read_engagement`.
