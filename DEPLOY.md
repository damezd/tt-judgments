# Deploying TT Judgments Intel (GitHub → Railway + Vercel)

Same setup as **tt-address**. Three stages: push to GitHub, deploy the backend on
Railway (with MySQL), deploy the frontend on Vercel. ~10 minutes.

> Before you start: if `frontend/node_modules` exists from an interrupted install,
> delete it — `rmdir /s /q frontend\node_modules` (PowerShell: `rm -r frontend\node_modules`).
> Railway/Vercel build in the cloud, so you don't need a local install for deploy.

---

## 1 · Push to GitHub

Create an **empty** repo named `tt-judgments` at https://github.com/new
(owner `damezd`, no README/.gitignore/license). Then, from the project folder:

```bash
cd C:\Users\User\dev\tt-judgments
git init
git add .
git commit -m "Initial commit: TT Judgments Intel"
git branch -M main
git remote add origin https://github.com/damezd/tt-judgments.git
git push -u origin main
```

(`.gitignore` already excludes `node_modules/`, `.env`, `dist/`.)

---

## 2 · Backend → Railway

1. https://railway.app → **New Project** → **Deploy from GitHub repo** → pick `tt-judgments`.
2. Railway will detect two folders. Set the service **Root Directory** to `backend`.
   - Build: `npm install` · Start: `npm start` (from `backend/package.json`).
3. In the project, **+ New** → **Database** → **MySQL**. This injects `MYSQL_URL`
   into the project automatically.
4. On the backend service → **Variables**, add:
   - `JWT_SECRET` = a long random string
   - `ADMIN_PASSWORD` = the password users will type to log in
   - `FRONTEND_URL` = your Vercel URL (fill in after stage 3, then redeploy)
   - `MYSQL_URL` = reference the MySQL plugin's variable (Railway: `${{MySQL.MYSQL_URL}}`)
5. **Seed the database** (one time). Easiest from your machine, pointed at Railway:
   ```bash
   cd backend
   npm install
   # set MYSQL_URL to the Railway "MYSQL_PUBLIC_URL" value:
   set MYSQL_URL=mysql://...   &  rem  (PowerShell: $env:MYSQL_URL="mysql://...")
   npm run import
   ```
   (Or run `npm run import` from a Railway shell where `MYSQL_URL` is already set.)
6. Confirm health: open `https://<your-backend>.up.railway.app/health` → `{"status":"ok"}`.
   Copy the backend URL.

---

## 3 · Frontend → Vercel

1. https://vercel.com → **Add New… → Project** → import `tt-judgments`.
2. Set **Root Directory** to `frontend` (framework auto-detects as Vite).
3. **Environment Variables**: `VITE_API_URL` = your Railway backend URL
   (e.g. `https://tt-judgments-backend.up.railway.app`).
4. Deploy. Copy the Vercel URL → go back to Railway and set `FRONTEND_URL` to it
   (for CORS), then redeploy the backend.

`frontend/vercel.json` already rewrites all routes to `index.html` for the SPA.

---

## 4 · Verify

- Visit the Vercel URL → log in with `ADMIN_PASSWORD`.
- People tab: search e.g. `Ramlogan`, `Maraj`, `Warner`.
- Companies tab: `NIDCO`, `TTMF`.
- Insights + Network tabs load.

## Auto-deploy

Both platforms are now linked to the repo: every `git push` to `main` redeploys the
backend (Railway) and frontend (Vercel) automatically.

---

### If you'd rather I push for you
I can push from here only if (a) you first create the empty `tt-judgments` repo on
GitHub, and (b) you provide a GitHub token — but I **cannot** create the repo or
touch your Railway/Vercel dashboards from this environment (the GitHub API and those
consoles aren't reachable, and they require your account login). The runbook above is
the most reliable path.
