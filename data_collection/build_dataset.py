"""
Turn the raw Adzuna downloads (data/raw/*.json) into two clean tables:

    data/india_data_analyst_jobs.csv    one row per job posting
    data/india_job_skills.csv           one row per (posting, skill), for Power BI

Run from the repository root:
    python data_collection/build_dataset.py

What the script does
    1. Joins all raw files and removes repeated postings (same id, or same title + company + city).
    2. Keeps only analyst-type job titles posted in the study window (since 1 June 2026).
    3. Adds role group, seniority, remote flag, experience, salary (in lakhs per year) and
       one yes/no column for each skill mentioned in the job text.
The job text itself is not saved, only the columns derived from it.
"""
import glob
import json
import re
from collections import Counter
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
STUDY_START = "2026-06-01"

# skill name -> regular expression (matched on lower-case title + description snippet)
SKILLS = {
    "SQL": r"\bsql\b|mysql|postgres|t-sql|pl/sql|ssms",
    "Excel": r"\bexcel\b|spreadsheet",
    "Power BI": r"power\s?-?bi",
    "Tableau": r"tableau",
    "Python": r"\bpython\b|pandas|numpy|pyspark",
    "R": r"rstudio|\br programming|\br language|python/r\b|\br/python|python or r\b|python and r\b|\br and python",
    "SAS": r"\bsas\b",
    "Looker / Data Studio": r"looker|data studio",
    "Qlik": r"qlik",
    "Google Analytics": r"google analytics|\bga4\b",
    "Snowflake": r"snowflake",
    "BigQuery": r"bigquery|big query",
    "AWS": r"\baws\b|redshift|amazon web services",
    "Azure": r"azure|synapse",
    "Spark / Hadoop": r"\bspark\b|hadoop|databricks|hive\b",
    "ETL": r"\betl\b|\belt\b|data pipeline|ssis|informatica|alteryx",
    "VBA / Macros": r"\bvba\b|macros?\b",
    "Statistics": r"statistic|hypothesis|regression|a/b test",
    "Machine learning": r"machine learning|\bml\b|predictive model",
    "Data visualisation": r"visuali[sz]|dashboard",
    "Reporting": r"\breporting\b|\bmis\b|\breports?\b(?! to)",
    "Communication": r"communicat|stakeholder|presentation",
}
SKILL_RE = {name: re.compile(pattern) for name, pattern in SKILLS.items()}

TITLE_KEEP = re.compile(r"analy|intelligence|\bbi\b|\bbie\b|insight|reporting|\bmis\b")
ENTRY = re.compile(r"\bintern\b|internship|trainee|junior|\bjr\b|fresher|entry|graduate")
SENIOR = re.compile(r"senior|\bsr\b|lead\b|principal|staff|manager|head\b|director|\bvp\b|architect")


def role_group(title):
    t = title.lower()
    if re.search(r"business intelligence|\bbi\b|\bbie\b|power bi|tableau", t):
        return "BI analyst / developer"
    if "business analyst" in t or "business analytics" in t:
        return "Business analyst"
    if re.search(r"data scien|machine learning|\bml\b|\bai\b", t):
        return "Data scientist / ML"
    if re.search(r"data engineer|etl|database|big data", t):
        return "Data engineer"
    if re.search(r"data analyst|data analytics|analytics analyst|analytics", t):
        return "Data analyst"
    return "Other analyst"


def seniority(title):
    t = title.lower()
    if SENIOR.search(t):
        return "Senior / lead / manager"
    if ENTRY.search(t):
        return "Entry level"
    return "Mid / not stated"


def work_mode(text):
    if re.search(r"work(ing)? from home|\bwfh\b|\bremote(ly)?\b|fully remote", text):
        return "Remote / WFH"
    if "hybrid" in text:
        return "Hybrid"
    return "Not stated"


def experience_years(text):
    match = re.search(r"(\d{1,2})\s*(?:\+|-|to|–)?\s*(?:\d{1,2})?\s*\+?\s*(?:years|yrs)", text)
    return int(match.group(1)) if match else None


def load_raw():
    rows = []
    for path in sorted(glob.glob(str(ROOT / "data" / "raw" / "in_*.json"))):
        payload = json.load(open(path, encoding="utf-8"))
        for job in payload["results"]:
            area = (job.get("location") or {}).get("area") or []
            rows.append({
                "job_id": str(job["id"]),
                "title": (job.get("title") or "").strip(),
                "company": ((job.get("company") or {}).get("display_name") or "Not stated").strip(),
                "city": area[-1] if len(area) > 1 else "India (not specified)",
                "posted_date": (job.get("created") or "")[:10],
                "contract_time": job.get("contract_time") or "Not stated",
                "salary_min": job.get("salary_min"),
                "salary_max": job.get("salary_max"),
                "salary_is_predicted": str(job.get("salary_is_predicted")) == "1",
                "text": f"{job.get('title', '')} {job.get('description', '')}".lower(),
            })
    return pd.DataFrame(rows)


def main():
    df = load_raw()
    log = {"rows downloaded": len(df)}

    df = df.drop_duplicates("job_id")
    log["after removing repeated ids"] = len(df)

    df = df[df["title"].str.lower().str.contains(TITLE_KEEP)]
    log["with an analyst-type title"] = len(df)

    df = df[df["posted_date"] >= STUDY_START]
    log[f"posted since {STUDY_START}"] = len(df)

    df = df.sort_values("posted_date", ascending=False)
    df = df.drop_duplicates(["title", "company", "city"], keep="first")
    log["after removing reposts (same title, company, city)"] = len(df)

    df["role_group"] = df["title"].map(role_group)
    df["seniority"] = df["title"].map(seniority)
    df["work_mode"] = df["text"].map(work_mode)
    df["experience_years_min"] = df["text"].map(experience_years)
    df["posted_month"] = df["posted_date"].str[:7]

    # Salary: Adzuna gives yearly rupees. Keep a salary only when it is stated by the employer,
    # has both ends, and the range is believable (top no more than 3x the bottom).
    low, high = df["salary_min"], df["salary_max"]
    usable = (~df["salary_is_predicted"]) & low.notna() & high.notna() & (low > 0) & (high <= 3 * low)
    df["salary_lpa"] = ((low + high) / 2 / 100000).where(usable).round(2)
    log["postings showing any salary"] = int(low.notna().sum())
    log["postings with a usable salary"] = int(usable.sum())

    top_cities = df.loc[df["city"] != "India (not specified)", "city"].value_counts().head(6).index
    df["city_group"] = df["city"].where(df["city"].isin(top_cities) | (df["city"] == "India (not specified)"), "Other cities")

    for name, pattern in SKILL_RE.items():
        df[name] = df["text"].map(lambda t, p=pattern: bool(p.search(t)))
    df["skills_found"] = df[list(SKILLS)].sum(axis=1)

    keep = ["job_id", "title", "company", "city", "posted_date", "posted_month", "role_group", "seniority",
            "city_group", "work_mode", "experience_years_min", "contract_time", "salary_lpa", "skills_found"] + list(SKILLS)
    out = df[keep].reset_index(drop=True)
    out.to_csv(ROOT / "data" / "india_data_analyst_jobs.csv", index=False)

    long = out.melt(id_vars="job_id", value_vars=list(SKILLS), var_name="skill", value_name="asked")
    long = long[long["asked"]][["job_id", "skill"]]
    long.to_csv(ROOT / "data" / "india_job_skills.csv", index=False)

    print("Cleaning log")
    for key, value in log.items():
        print(f"  {key}: {value}")
    print(f"\nWrote {len(out)} postings and {len(long)} posting-skill rows")
    print(out["role_group"].value_counts().to_string())


if __name__ == "__main__":
    main()
