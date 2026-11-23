"""
Count how many India postings titled "data analyst" on Adzuna mention each skill.

Adzuna only returns the first 500 characters of each job description, but its search
looks at the full job text. So asking "how many postings titled data analyst also mention SQL"
gives a much better measure of skill demand than counting words in the snippets.

Run from the repository root (same environment variables as fetch_adzuna.py):
    python data_collection/fetch_skill_counts.py

Output: data/skill_demand_counts.csv
Uses one small request (1 result per page) for the total and one for each skill.
"""
import os
import time
from pathlib import Path

import pandas as pd
import requests

OUT = Path(__file__).resolve().parents[1] / "data" / "skill_demand_counts.csv"
BASE = "https://api.adzuna.com/v1/api/jobs/in/search/1"
ROLE = "data analyst"
SKILLS = ["SQL", "Excel", "Power BI", "Tableau", "Python", "SAS", "Looker", "Qlik", "Snowflake",
          "AWS", "Azure", "machine learning", "statistics", "ETL", "VBA", "Google Analytics"]
ARRANGEMENTS = ["remote", "work from home", "hybrid"]


def count(app_id, app_key, extra=""):
    params = {"app_id": app_id, "app_key": app_key, "results_per_page": 1,
              "title_only": ROLE, "content-type": "application/json"}
    if extra:
        params["what_and"] = extra   # skill must appear somewhere in the job text
    response = requests.get(BASE, params=params, timeout=30, headers={"User-Agent": "job-market-analysis/1.0"})
    response.raise_for_status()
    return response.json()["count"]


def main():
    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise SystemExit("Set ADZUNA_APP_ID and ADZUNA_APP_KEY first.")
    total = count(app_id, app_key)
    rows = [{"type": "total", "skill": "(all data analyst postings)", "postings": total, "share_pct": 100.0}]
    for kind, terms in (("skill", SKILLS), ("work arrangement", ARRANGEMENTS)):
        for term in terms:
            time.sleep(1)
            n = count(app_id, app_key, term)
            rows.append({"type": kind, "skill": term, "postings": n, "share_pct": round(n / total * 100, 1)})
            print(f"{term:18s} {n:5d}  {n / total:.1%}")
    df = pd.DataFrame(rows)
    df["fetched_on"] = time.strftime("%Y-%m-%d")
    df.to_csv(OUT, index=False)
    print(f"\nTotal matching '{ROLE}': {total}. Saved {OUT.name}")


if __name__ == "__main__":
    main()
