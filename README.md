# TalentScope Analytics

TalentScope Analytics is a production-style full stack job market intelligence platform that ingests live listings from Adzuna, extracts demand signals with spaCy, and delivers actionable insights through a modern SaaS dashboard.

## Live Link

- Frontend (live now): `http://localhost:5173`
- Backend API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Highlights

- FastAPI backend with async endpoints, MongoDB indexing, layered modules, and structured logging
- JWT authentication with protected and admin-only routes
- Live job ingestion via Adzuna API (no mocked listing data)
- Manual + scheduled sync pipeline with ingestion logs
- spaCy-powered skill extraction and normalization
- Live job listings feed endpoint for latest postings
- Market insight analytics:
  - total jobs analyzed
  - top skills
  - salary distribution
  - remote vs onsite ratio
  - hiring trend over time
- Skill gap analyzer against current demand
- Role intelligence search by title
- Custom feature: **Market Heat Score** (volume + remote + salary signal)
- React + TypeScript + Tailwind dashboard with dark/light mode and Recharts
- Dockerized backend and frontend + `docker-compose`
- Pytest coverage for auth API and skill extraction

## Stack

- Backend: Python, FastAPI, Motor (MongoDB), Pydantic v2, APScheduler, spaCy
- Frontend: React (Vite), TypeScript, TailwindCSS, Recharts
- Database: MongoDB (Atlas-compatible)

## Project Structure

```text
talentscope-analytics/
├─ backend/
│  ├─ app/
│  │  ├─ admin/
│  │  ├─ analytics_engine/
│  │  ├─ auth_core/
│  │  ├─ core/
│  │  ├─ db/
│  │  ├─ ingestion/
│  │  ├─ market_insights/
│  │  ├─ models/
│  │  ├─ schemas/
│  │  ├─ dependencies.py
│  │  └─ main.py
│  ├─ tests/
│  ├─ Dockerfile
│  ├─ .env.example
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ lib/
│  │  ├─ pages/
│  │  ├─ state/
│  │  ├─ types/
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ Dockerfile
│  ├─ .env.example
│  └─ package.json
├─ docker-compose.yml
└─ .env.example
```

## Local Setup

### 1) Environment variables

Copy environment templates:

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
- On a fresh database, the **first signup user automatically gets admin role**.
- To create first admin:
  - Set `ADMIN_BOOTSTRAP_KEY` in backend env
  - Call `POST /api/v1/auth/seed-admin` with `bootstrap_key`

## Data Ingestion

- Manual sync (admin only): `POST /api/v1/admin/sync`
- Ingestion logs (admin only): `GET /api/v1/admin/ingestion-logs`
- Scheduled sync runs every `SYNC_INTERVAL_MINUTES`

Adzuna credentials are required:

```env
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

## Core API Routes

- `GET /api/v1/auth/bootstrap-status`
- `GET /api/v1/insights/dashboard`
- `GET /api/v1/insights/live-jobs?limit=20&title=data+engineer`
- `GET /api/v1/insights/role-intelligence?title=data+engineer`
- `POST /api/v1/insights/skill-gap`
- `POST /api/v1/admin/sync`
- `GET /api/v1/admin/ingestion-logs`

## Tests

```bash
cd backend
pytest -q
```

Included tests:
- auth API flow (`signup`, `login`, `me`, duplicate handling)
- skill extraction logic

## Deployment

### Backend on Render or Railway

1. Deploy from `backend/` directory.
2. Build command:
   - `pip install -r requirements.txt`
3. Start command:
   - `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables from `backend/.env.example`.
5. Use MongoDB Atlas URI for `MONGO_URI`.
6. Ensure `CORS_ORIGINS` includes frontend domain.

### Frontend on Vercel

1. Import `frontend/` project.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set env:
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`

## Demo Script

Use [demo-walkthrough.md](docs/demo-walkthrough.md) for a practical recording flow and architecture narration.

## Why this architecture

- MongoDB is used for flexible job documents and aggregation-friendly analytics.
- FastAPI gives strong async performance and concise API contracts.
- Async ingestion and cached analytics endpoints improve responsiveness.
- JWT fits stateless SPA auth with simple deployment topology.
