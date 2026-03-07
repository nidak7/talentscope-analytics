# TalentScope Analytics

TalentScope Analytics is a job market analysis app.

It pulls live job listings, extracts recurring skills, and shows a cleaner view of:
- which skills are showing up most often
- salary bands when listings disclose them
- remote vs onsite split
- hiring trend over time
- role-specific demand
- a simple skill gap check against the current market

## Live links

- Frontend: `https://talentscope-analytics.vercel.app`
- Backend: `https://talentscope-analytics-api.onrender.com`
- API docs: `https://talentscope-analytics-api.onrender.com/docs`

## Stack

- Backend: FastAPI, MongoDB, Motor, Pydantic, spaCy, JWT
- Frontend: React, Vite, TypeScript, TailwindCSS, Recharts
- Deployment: Vercel + Render + MongoDB Atlas

## Project layout

```text
talentscope-analytics/
backend/
  app/
    admin/
    analytics_engine/
    auth_core/
    core/
    db/
    ingestion/
    market_insights/
    models/
    schemas/
    dependencies.py
    main.py
  tests/
  Dockerfile
  .env.example
  requirements.txt
frontend/
  src/
    components/
    hooks/
    lib/
    pages/
    state/
    types/
    App.tsx
    main.tsx
  Dockerfile
  .env.example
  package.json
docker-compose.yml
.env.example
render.yaml
```

## What the app does

### Dashboard
- total jobs analyzed
- top in-demand skills
- salary distribution
- remote vs onsite ratio
- hiring trend
- recent listings that explain the numbers

### Role intelligence
- search by role title
- see total jobs, salary signal, top skills, top locations, and trend

### Skill gap
- enter a role and your current skills
- get matched skills, missing high-demand skills, and a demand score

### Admin
- trigger a live sync
- reset stored market data
- review ingestion logs

## Local setup

### 1. Copy env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

Backend:
- Health: `http://localhost:8000/health`
- Docs: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- App: `http://localhost:5173`

## Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Environment notes

### Mongo

For Docker:

```env
MONGO_URI=mongodb://mongo:27017
```

For local machine:

```env
MONGO_URI=mongodb://localhost:27017
```

For production:

```env
MONGO_URI=mongodb+srv://...
```

### Job data

Adzuna is the preferred source:

```env
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

If Adzuna is missing or fails, the backend falls back to public feeds so the UI does not stay empty.

### Auth / admin

- first user on a fresh database becomes admin
- JWT is used for the SPA session
- protected endpoints are used for profile and admin actions

## Useful API routes

- `GET /api/v1/auth/bootstrap-status`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/claim-admin`
- `GET /api/v1/insights/dashboard`
- `GET /api/v1/insights/live-jobs`
- `GET /api/v1/insights/role-intelligence`
- `POST /api/v1/insights/skill-gap`
- `POST /api/v1/insights/bootstrap-sync`
- `POST /api/v1/admin/sync`
- `POST /api/v1/admin/reset-data`
- `GET /api/v1/admin/ingestion-logs`

## Testing

### Backend

```bash
cd backend
pytest -q
```

Current test coverage includes:
- auth flow
- duplicate signup handling
- current user endpoint
- skill extraction logic

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

## Deploy

### Backend on Render

- connect the repo in Render
- use the included `render.yaml`
- set:
  - `MONGO_URI`
  - `JWT_SECRET_KEY`
  - `ADMIN_BOOTSTRAP_KEY`
  - `ADZUNA_APP_ID`
  - `ADZUNA_APP_KEY`
  - `CORS_ORIGINS`

### Frontend on Vercel

- import the `frontend/` directory
- build command: `npm run build`
- output directory: `dist`
- set:

```env
VITE_API_BASE_URL=https://talentscope-analytics-api.onrender.com/api/v1
```

## Notes

- The backend does the analysis. The frontend only presents it.
- MongoDB is used because job documents and extracted skills are easier to store and query as flexible records.
- FastAPI keeps the API small and fast without adding framework weight that this project does not need.
