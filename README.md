# TalentScope Analytics

TalentScope Analytics is a production-style full stack job market intelligence platform that ingests live listings, extracts demand signals with spaCy, and delivers market insights through a modern dashboard.

## URLs

Local (default):
- Frontend: `http://localhost:5173`
- Backend API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

Production (current deployment):
- Frontend: `https://talentscope-analytics.vercel.app`
- Backend: `https://talentscope-analytics-api.onrender.com`
- Backend API docs: `https://talentscope-analytics-api.onrender.com/docs`

Deployment note:
- The public deployment is live on Vercel + Render.
- To make the hosted backend fully persistent, replace the current `MONGO_URI` on Render with your MongoDB Atlas connection string.

## Highlights

- FastAPI backend with async endpoints, MongoDB indexing, layered modules, and structured logging
- JWT authentication with protected and admin-only routes
- Live job ingestion via Adzuna API (no mocked listing data)
- Public-feed fallback ingestion (Arbeitnow, Remotive, The Muse) when Adzuna credentials are unavailable
- Manual + scheduled sync pipeline with ingestion logs
- spaCy-powered skill extraction and normalization
- Market insight analytics (skills, salaries, remote ratio, hiring trends)
- Skill gap analyzer against current demand
- Role intelligence search by title
- Custom feature: Market Heat Score (volume + remote + salary signal)
- React + TypeScript + Tailwind dashboard with dark/light mode and Recharts
- Dockerized backend and frontend + docker-compose
- Pytest coverage for auth API and skill extraction

## Stack

- Backend: Python, FastAPI, Motor (MongoDB), Pydantic v2, APScheduler, spaCy
- Frontend: React (Vite), TypeScript, TailwindCSS, Recharts
- Database: MongoDB (Atlas-compatible)

## Project Structure

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

## Local Setup

### 1) Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local Docker compose, set `backend/.env` with:

```env
MONGO_URI=mongodb://mongo:27017
```

For local host dev (outside Docker), set:

```env
MONGO_URI=mongodb://localhost:27017
```

### 2) Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --port 8000
```

API health: `http://localhost:8000/health`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

## Docker Setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Authentication and Admin Bootstrap

- Public auth routes:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me` (protected)
- On a fresh database, the first signup user automatically gets admin role.
- If users exist but no admin exists, a logged-in user can claim admin via `POST /api/v1/auth/claim-admin`.
- To create first admin:
  - Set `ADMIN_BOOTSTRAP_KEY` in backend env
  - Call `POST /api/v1/auth/seed-admin` with `bootstrap_key`

## Data Ingestion

- Manual sync (admin only): `POST /api/v1/admin/sync`
- Reset stored data (admin only): `POST /api/v1/admin/reset-data`
- Bootstrap sync (authenticated users): `POST /api/v1/insights/bootstrap-sync`
- Ingestion logs (admin only): `GET /api/v1/admin/ingestion-logs`
- Scheduled sync runs every `SYNC_INTERVAL_MINUTES`

Adzuna credentials are required:

```env
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

If Adzuna credentials are missing or invalid, the system falls back to a public job feed so dashboards are not empty.

## Core API Routes

- `GET /api/v1/auth/bootstrap-status`
- `POST /api/v1/auth/claim-admin`
- `GET /api/v1/insights/dashboard`
- `GET /api/v1/insights/live-jobs?limit=20&title=data+engineer`
- `POST /api/v1/insights/bootstrap-sync`
- `GET /api/v1/insights/role-intelligence?title=data+engineer`
- `POST /api/v1/insights/skill-gap`
- `POST /api/v1/admin/sync`
- `POST /api/v1/admin/reset-data`
- `GET /api/v1/admin/ingestion-logs`

## Deployment (Vercel + Render)

### Backend on Render

- Use the included `render.yaml` in the repo root.
- Create a new Web Service on Render from this GitHub repo.
- Render will read `render.yaml` and prompt for required secrets:
  - `MONGO_URI`, `JWT_SECRET_KEY`, `ADMIN_BOOTSTRAP_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `CORS_ORIGINS`
- Set `CORS_ORIGINS` to the Vercel frontend URL once deployed.
- Current backend URL: `https://talentscope-analytics-api.onrender.com`

### Frontend on Vercel

- Import the `frontend/` folder as a Vercel project.
- Build command: `npm run build`
- Output directory: `dist`
- Env var:
  - `VITE_API_BASE_URL=https://talentscope-analytics-api.onrender.com/api/v1`
- Current frontend URL: `https://talentscope-analytics.vercel.app`

## Tests

```bash
cd backend
pytest -q
```

Included tests:
- auth API flow (signup, login, me, duplicate handling)
- skill extraction logic

## Demo Script

Use `docs/demo-walkthrough.md` for a practical recording flow and architecture narration.

## Why this architecture

- MongoDB is used for flexible job documents and aggregation-friendly analytics.
- FastAPI gives strong async performance and concise API contracts.
- Async ingestion and cached analytics endpoints improve responsiveness.
- JWT fits stateless SPA auth with simple deployment topology.
