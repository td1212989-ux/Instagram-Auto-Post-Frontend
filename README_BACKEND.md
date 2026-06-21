# README — Backend for Instagram Auto Poster

> This backend powers the existing Lovable frontend. **Do not modify the frontend.**
> Implement the endpoints exactly as defined in `src/contracts/API_CONTRACT.md`
> and `BACKEND_REQUIREMENTS.md`.

## TL;DR

1. Read **`BACKEND_REQUIREMENTS.md`** — full spec, schemas, flows.
2. Read **`src/contracts/API_CONTRACT.md`** — every endpoint's request/response.
3. Copy `src/contracts/*.ts` into your backend `src/contracts/` so both sides
   share the same types.
4. Use endpoints exactly as in `src/constants/api.ts` (no path changes).
5. Set env vars from **`ENVIRONMENT.md`**.
6. Import **`POSTMAN_COLLECTION.json`** to test every route.

## Quick Start

```bash
mkdir backend && cd backend
npm init -y
npm i express mongoose multer cloudinary axios node-cron zod cors helmet \
      express-rate-limit pino pino-pretty dotenv
npm i -D typescript ts-node-dev @types/node @types/express @types/multer @types/cors
npx tsc --init
cp ../ENVIRONMENT.md.sample .env   # fill in real values
```

Project layout: see **§2 Expected Folder Structure** in `BACKEND_REQUIREMENTS.md`.

## What You Must Build

- **CRUD for `posts`** backed by MongoDB.
- **Multipart uploader** → Cloudinary, persist returned `secure_url` and `public_id`.
- **Daily cron** (node-cron) honoring `settings.dailyTime` + `settings.timezone`.
- **Instagram publisher** for images and reels (Graph API v19+).
- **Auto-delete** Cloudinary asset after successful publish.
- **Settings singleton** with `GET`/`PUT`.
- **Manual trigger** `POST /api/cron/run` (header `x-cron-secret`).

## Non-Negotiable Contract Rules

- Response **must** match `Post`, `DashboardStats`, `Settings` field-for-field.
- IDs are `string` (Mongo `_id.toString()`), dates are **ISO strings**.
- Errors **must** use the `ErrorResponse` envelope:
  `{ ok: false, message, code?, errors? }`.
- Status codes: see `API_CONTRACT.md` per endpoint.
- CORS: allow the frontend origin only (`CORS_ORIGIN` env).

## Local Dev With The Frontend

The frontend axios baseURL is `import.meta.env.VITE_API_URL ?? "/api"`.
Two options:

1. **Vite proxy** — add to `vite.config.ts`:
   ```ts
   server: { proxy: { "/api": "http://localhost:4000" } }
   ```
2. **Cross-origin** — set `VITE_API_URL=http://localhost:4000/api` and
   enable CORS for `http://localhost:5173`.

## Validation Checklist

- [ ] All endpoints from `src/constants/api.ts` are implemented.
- [ ] Field names exactly match `src/contracts/*`.
- [ ] Upload accepts `files[]` + `posts` JSON string and validates types/sizes.
- [ ] Cron respects `dailyTime` + `timezone` + `queueMethod`.
- [ ] Cloudinary asset is destroyed after successful Instagram publish.
- [ ] Errors use `ErrorResponse` envelope and correct status codes.
- [ ] Rate limits applied (see §9 of `BACKEND_REQUIREMENTS.md`).
- [ ] `GET /api/health` returns `{ ok: true }`.

## Reference Files

| File                              | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `src/contracts/API_CONTRACT.md`   | Per-endpoint OpenAPI-style reference |
| `src/contracts/*.ts`              | TypeScript request/response types    |
| `src/constants/api.ts`            | Canonical endpoint paths             |
| `BACKEND_REQUIREMENTS.md`         | Architecture, schemas, flows         |
| `ENVIRONMENT.md`                  | All env vars                         |
| `POSTMAN_COLLECTION.json`         | Importable API test collection       |
| `DOCUMENTATION.md`                | Frontend developer documentation     |
