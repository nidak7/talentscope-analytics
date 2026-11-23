"""
Measure demand and skills for ten job roles in India using the Adzuna API.

For each role the script asks Adzuna how many India postings have the role in the TITLE,
and how many of those also mention each skill (or "remote" / "work from home") anywhere in
the full job text. Adzuna's average advertised salary for the role comes back with the
first request. Each request asks for a single result, so only the counts are downloaded.

Run from the repository root (never commit your keys):
    export ADZUNA_APP_ID=...  ADZUNA_APP_KEY=...
    python data_collection/fetch_role_demand.py

Output: data/role_skill_demand.csv
"""
import os
import time
from pathlib import Path

import pandas as pd
import requests

OUT = Path(__file__).resolve().parents[1] / "data" / "role_skill_demand.csv"
BASE = "https://api.adzuna.com/v1/api/jobs/in/search/1"

# role (searched in the job title) -> skills that are meaningful for that role
ROLES = {
    "data analyst": ["SQL", "Excel", "Power BI", "Tableau", "Python", "statistics", "ETL", "machine learning",
                     "Azure", "AWS", "Snowflake", "Google Analytics", "Looker", "SAS", "VBA", "Qlik"],
    "data scientist": ["Python", "machine learning", "SQL", "statistics", "deep learning", "NLP", "TensorFlow", "PyTorch", "AWS"],
    "software developer": ["Java", "Python", "JavaScript", "SQL", "React", "Git", "AWS", "Docker", "Spring Boot"],
    "business analyst": ["SQL", "Excel", "Power BI", "Agile", "JIRA", "Tableau", "Python", "requirements"],
    "digital marketing": ["SEO", "Google Analytics", "Google Ads", "social media", "Excel", "CRM", "content", "email marketing"],
    "accountant": ["Excel", "Tally", "SAP", "GST", "QuickBooks", "Power BI", "SQL", "taxation"],
    "hr executive": ["recruitment", "payroll", "HRIS", "Excel", "onboarding", "ATS", "communication", "labour law"],
    "product manager": ["SQL", "Agile", "JIRA", "roadmap", "analytics", "Figma", "Excel", "stakeholder"],
    "project manager": ["Agile", "Scrum", "JIRA", "PMP", "Excel", "MS Project", "stakeholder", "budget"],
    "sales executive": ["CRM", "Salesforce", "Excel", "lead generation", "negotiation", "communication", "B2B", "cold calling"],
}
ARRANGEMENTS = ["remote", "work from home", "hybrid"]


def ask(app_id, app_key, role, term=None):
    params = {"app_id": app_id, "app_key": app_key, "results_per_page": 1, "title_only": role,
              "content-type": "application/json"}
    if term:
        params["what_and"] = term   # must appear somewhere in the full job text
    response = requests.get(BASE, params=params, timeout=30, headers={"User-Agent": "job-market-analysis/1.0"})
    response.raise_for_status()
    return response.json()


def main():
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise SystemExit("Set ADZUNA_APP_ID and ADZUNA_APP_KEY first.")
    today = time.strftime("%Y-%m-%d")
    # Keep what was already collected and only ask for terms that are missing
    old = pd.read_csv(OUT) if OUT.exists() else pd.DataFrame(
        columns=["role", "kind", "term", "postings", "share_pct", "avg_advertised_salary_inr", "fetched_on"])
    have = set(zip(old["role"], old["term"]))
    rows = []
    for role, skills in ROLES.items():
        total_row = old[(old["role"] == role) & (old["kind"] == "total")]
        if total_row.empty:
            first = ask(app_id, app_key, role)
            total = first["count"]
            rows.append({"role": role, "kind": "total", "term": "(all postings)", "postings": total, "share_pct": 100.0,
                         "avg_advertised_salary_inr": round(first.get("mean") or 0), "fetched_on": today})
            print(f"{role}: {total} postings")
        else:
            total = int(total_row["postings"].iloc[0])
        for kind, terms in (("skill", skills), ("work arrangement", ARRANGEMENTS)):
            for term in terms:
                if (role, term) in have:
                    continue
                time.sleep(1)
                n = ask(app_id, app_key, role, term)["count"]
                rows.append({"role": role, "kind": kind, "term": term, "postings": n,
                             "share_pct": round(100 * n / total, 1) if total else 0.0,
                             "avg_advertised_salary_inr": None, "fetched_on": today})
                print(f"  {role} / {term}: {n}")
    result = pd.concat([old, pd.DataFrame(rows)], ignore_index=True)
    order = {"total": 0, "skill": 1, "work arrangement": 2}
    result = result.sort_values(["role", "kind"], key=lambda c: c.map(order) if c.name == "kind" else c, kind="stable")
    result.to_csv(OUT, index=False)
    print(f"Saved {OUT.name}: {len(rows)} new rows, {len(result)} in total")


if __name__ == "__main__":
    main()
