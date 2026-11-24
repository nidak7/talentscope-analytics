"""Skill gap check for a target job role (India, Adzuna data fetched 2026-11-24).

For a role, take its top N skills by demand (the share of postings that mention
the skill), mark which ones the candidate has, and work out a coverage score:

    coverage = sum of demand share of the skills you have
               / sum of demand share of all top N skills

Missing skills are ranked by demand. A mention in a posting isn't a
requirement, so coverage is only a rough guide.

Usage (run from the project folder):
    python analysis/skill_gap.py --role "data scientist" --skills "SQL,Python,Excel"
    python analysis/skill_gap.py --role "business analyst"      # reads data/candidate_skills.csv
    python analysis/skill_gap.py --role "data analyst" --top-n 5
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

DATA = Path(__file__).resolve().parent.parent / "data"


def load_demand(path=DATA / "role_skill_demand.csv"):
    return pd.read_csv(path)


def load_candidate(path=DATA / "candidate_skills.csv"):
    c = pd.read_csv(path)
    return c.loc[c["have"].str.strip().str.lower() == "yes", "skill"].tolist()


def skill_gap(role, have_skills, top_n=8, demand=None):
    """Return a dict with the gap table, the coverage % and the missing skills."""
    demand = load_demand() if demand is None else demand
    roles = sorted(demand["role"].unique())
    if role.lower() not in roles:
        raise ValueError(f"Unknown role '{role}'. Valid roles: {', '.join(roles)}")
    have = {s.strip().lower() for s in have_skills if s.strip()}
    d = demand[(demand["role"] == role.lower()) & (demand["kind"] == "skill")]
    d = d.sort_values(["share_pct", "term"], ascending=[False, True]).head(top_n)
    table = d[["term", "postings", "share_pct"]].rename(columns={"term": "skill"}).reset_index(drop=True)
    table["have"] = table["skill"].str.lower().isin(have).map({True: "Yes", False: "No"})
    coverage = 100 * table.loc[table["have"] == "Yes", "share_pct"].sum() / table["share_pct"].sum()
    missing = table[table["have"] == "No"].sort_values("share_pct", ascending=False)["skill"].tolist()
    return {"role": role.lower(), "table": table, "coverage_pct": round(coverage, 1), "missing": missing}


def main():
    ap = argparse.ArgumentParser(description="Skill gap check for a target role.")
    ap.add_argument("--role", required=True, help='target role, e.g. "data scientist"')
    ap.add_argument("--skills", help='comma separated skills you have, e.g. "SQL,Python,Excel". '
                                     "If left out, data/candidate_skills.csv is used.")
    ap.add_argument("--top-n", type=int, default=8, help="how many top skills to compare (default 8)")
    a = ap.parse_args()
    try:
        have = a.skills.split(",") if a.skills else load_candidate()
        r = skill_gap(a.role, have, a.top_n)
    except ValueError as e:
        sys.exit(str(e))
    print(f"Skill gap for: {r['role']}  (top {a.top_n} skills)")
    print(f"Skills I have: {', '.join(s.strip() for s in have if s.strip())}\n")
    print(r["table"].to_string(index=False))
    print(f"\nCoverage: {r['coverage_pct']}%")
    print("Missing, most in demand first: " + (", ".join(r["missing"]) or "none"))


if __name__ == "__main__":
    main()
