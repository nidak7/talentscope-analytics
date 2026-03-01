# TalentScope Analytics Demo Walkthrough

## 1) Product overview (30s)

- TalentScope Analytics ingests live job data from Adzuna.
- It extracts skills from real descriptions using spaCy.
- The platform exposes trend analytics: skill demand, salary, remote mix, and hiring momentum.

## 2) Backend architecture (1 min)

- FastAPI powers async APIs.
- MongoDB stores job documents and supports aggregation-heavy analytics.
- `ingestion/sync_engine.py` handles manual + scheduled sync.
- `analytics_engine/skill_extractor.py` extracts normalized skills.
- `market_insights/query_engine.py` computes dashboard, role intelligence, and skill-gap insights.
- JWT auth secures protected routes and admin controls.

## 3) Key features (1-2 min)

- Dashboard: total jobs, top skills, salary distribution, remote ratio, hiring trend, Market Heat Score.
- Role Intelligence Search: query role title to get salary stats, top skills, locations, and trend.
- Skill Gap Analyzer: enter known skills and get missing high-demand skills + demand score.
- Admin: trigger sync and inspect ingestion logs.

## 4) Engineering decisions (1 min)

- Why FastAPI: high-performance async stack with strict schema validation.
- Why MongoDB: job payload shape varies by source and aggregations are straightforward.
- Why async ingestion: multiple external calls + IO-bound workload.
- Why JWT: stateless auth works well with SPA + API deployment split.

## 5) Deployment readiness (30s)

- Dockerized backend/frontend with compose.
- Backend deploy instructions for Render/Railway.
- Frontend deploy instructions for Vercel.
- Environment templates included for quick onboarding.

