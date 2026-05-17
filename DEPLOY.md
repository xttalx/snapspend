# Deploy SnapSpend (GitHub + Supabase + Vercel)

## Step 1 — Supabase database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → run `supabase/migrations/001_initial.sql`.
3. Copy from **Project Settings → API**:
   - Project URL → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose in frontend)
   - `anon` key → `VITE_SUPABASE_ANON_KEY`

## Step 2 — GitHub

```bash
cd snapsend2
git init
git add .
git commit -m "SnapSpend production setup"
git remote add origin https://github.com/YOUR_USER/snapspend.git
git push -u origin main
```

## Step 3 — Vercel

1. Import the GitHub repo at [vercel.com](https://vercel.com).
2. **Environment variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `JWT_SECRET` | Long random string |
| `FRONTEND_URL` | `https://YOUR_APP.vercel.app` |
| `CORS_ORIGIN` | Same as FRONTEND_URL |
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key |

3. Deploy. API routes live at `/api/*` on the same domain as the app.

## Step 4 — Use the app

- **App:** `https://YOUR_APP.vercel.app/`

## Local development

```bash
cp .env.example .env
# Fill in Supabase keys (or leave empty to use JSON file fallback)

npm install
npm run dev
```

- Web: http://localhost:5173/
- API: http://localhost:3456/api/health  
