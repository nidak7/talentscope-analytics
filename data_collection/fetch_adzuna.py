"""
Download data analyst job postings from the Adzuna API and save them as raw JSON.

Setup
    1. Register for a free key at https://developer.adzuna.com
    2. Set two environment variables (never commit them):
           ADZUNA_APP_ID=...   ADZUNA_APP_KEY=...

Run from the repository root:
    python data_collection/fetch_adzuna.py            # run the full plan
    python data_collection/fetch_adzuna.py --max-calls 1   # try a single call

Every response is cached in data/raw/, so re-running never repeats a call that
already succeeded. The free test plan only allows 25 calls in total, so the plan
below is kept small on purpose.
"""
import argparse
import json
import os
import re
import time
from pathlib import Path

import requests

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"
RESULTS_PER_PAGE = 50

# (country code, search phrase, pages). This study covers India only.
# Adzuna has no Saudi Arabia or Gulf listings.
PLAN = [
    ("in", "data analyst", 5),
    ("in", "business intelligence analyst", 3),
    ("in", "remote data analyst", 1),
    ("in", "work from home data analyst", 1),
]


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def fetch(country, what, page, app_id, app_key):
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    params = {"app_id": app_id, "app_key": app_key, "results_per_page": RESULTS_PER_PAGE,
              "what": what, "content-type": "application/json"}
    response = requests.get(url, params=params, timeout=30,
                            headers={"User-Agent": "job-market-analysis/1.0"})
    return response


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-calls", type=int, default=25, help="stop after this many API calls")
    args = parser.parse_args()

    app_id, app_key = os.environ.get("ADZUNA_APP_ID"), os.environ.get("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        raise SystemExit("Set ADZUNA_APP_ID and ADZUNA_APP_KEY first.")

    RAW.mkdir(parents=True, exist_ok=True)
    calls = 0
    for country, what, pages in PLAN:
        for page in range(1, pages + 1):
            out = RAW / f"{country}_{slug(what)}_p{page}.json"
            if out.exists():
                continue
            if calls >= args.max_calls:
                print(f"Stopped after {calls} calls (limit reached).")
                return
            response = fetch(country, what, page, app_id, app_key)
            calls += 1
            if response.status_code != 200:
                print(f"{country} / {what} / page {page}: HTTP {response.status_code} {response.text[:150]}")
                return
            payload = response.json()
            payload["_meta"] = {"country": country, "query": what, "page": page,
                                "fetched_on": time.strftime("%Y-%m-%d")}
            out.write_text(json.dumps(payload), encoding="utf-8")
            print(f"{country} / {what} / page {page}: {len(payload.get('results', []))} postings "
                  f"(Adzuna reports {payload.get('count')} matches)")
            time.sleep(1)
    print(f"Done. {calls} API calls used this run.")


if __name__ == "__main__":
    main()
