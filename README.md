# TT Judgments Intel

A searchable knowledge base built from OSINT extraction of Trinidad &amp; Tobago court
judgments. Same stack and deploy flow as **tt-address**:

- **Frontend** — React + Vite + Tailwind (deploy to Vercel)
- **Backend** — Express + MySQL (`mysql2`) + JWT auth (deploy to Railway)
- **Auth** — single shared password &rarr; JWT (24h), stored in `localStorage`

## Features

| Tab | What it does |
|-----|--------------|
| **People** | Search any person (claimant, defendant, director/officer, named individual) &rarr; the cases they appear in, grouped by person. |
| **Companies** | Search companies / banks / FIs &rarr; cases + directors, with near-duplicate names merged. |
| **Cases** | Browse/filter all cases by OSINT value, court and keyword; click for full detail. |
| **Insights** | Counts, recurring cross-case entities, caseload by judge, court split, largest TTD figures. |
| **Network** | Interactive corporate-network graph (people &harr; companies &harr; banks &harr; cases) via vis-network. |

The case detail view shows parties, companies/entities, named individuals, financial
figures, property/lease terms, related litigation, outcome, OSINT notes, and a link to
the source PDF.

---

## Project layout

```
tt-judgments/
├─ database/schema.sql            # MySQL schema (cases + child tables)
├─ backend/                       # Express API
│  ├─ src/index.js                # app + route mounting
│  ├─ src/routes/                 # auth, search, cases, insights, network
│  ├─ src/middleware/auth.js      # JWT guard
│  └─ scripts/import-data.js      # loads scripts/data/*.json into MySQL
│     └─ data/batch2.json         # the 86-case knowledge base
└─ frontend/                      # React + Vite + Tailwind
   └─ src/{api,components}/...
```

---

## Local development

> Note: if a partial `frontend/node_modules` exists (it can be left behind by an
> interrupted install on a mounted drive), delete that folder first, then install.

### 1. Backend

```bash
cd backend
npm install
cp ../.env.example .env          # then fill in MYSQL_URL, JWT_SECRET, ADMIN_PASSWORD
npm run import                   # creates tables + loads scripts/data/*.json
npm run dev                      # http://localhost:3001
```

`npm run import` reads every `*.json` in `backend/scripts/data`. To add the earlier
92-case batch later, drop its JSON (same shape) in that folder and re-run import —
files named `*batch1*` / `*92*` are tagged batch 1 automatically.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173 (proxies /api to :3001)
```

For local dev the Vite proxy points `/api` at `http://localhost:3001`, so no
`VITE_API_URL` is needed. Set it only for production.

---

## Deployment (mirrors tt-address)

### Backend &rarr; Railway
1. New project &rarr; add the **MySQL** plugin (injects `MYSQL_URL`).
2. Deploy the `backend/` folder. Set Variables: `JWT_SECRET`, `ADMIN_PASSWORD`,
   `FRONTEND_URL` (your Vercel URL).
3. Run the importer once (Railway shell or locally pointed at the Railway DB):
   `npm run import`.
4. Health check: `GET /health`.

### Frontend &rarr; Vercel
1. Import the `frontend/` folder (Vite preset).
2. Set env `VITE_API_URL` = your Railway backend URL.
3. `vercel.json` already rewrites all routes to `index.html` for the SPA.

---

## API

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | `{ password }` &rarr; `{ token }` |
| GET | `/api/search/people?q=` | person search (grouped) |
| GET | `/api/search/entities?q=` | company / bank search (grouped) |
| GET | `/api/cases?value=&court=&q=` | case list |
| GET | `/api/cases/:slug` | full case detail |
| GET | `/api/insights` | dashboard analytics |
| GET | `/api/network` | graph nodes + edges |

## Data

86 cases (Batch 2 of 2). Facts are extracted strictly from the published judgment
text; empty fields mean the judgment did not address that category. 6 cases were not
retrievable at extraction time and are flagged (`fetch_failed`).
