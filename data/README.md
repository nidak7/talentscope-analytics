# Data

All files come from the Adzuna job search API for India, collected on 24 November 2026.

## role_skill_demand.csv

One row per role and term. This is what the main analysis and the skill gap use.

| Column | What it means |
|---|---|
| role | One of the ten roles, matched in the job title |
| kind | `total` (all postings for the role), `skill`, or `work arrangement` (remote, work from home, hybrid) |
| term | The skill or phrase I searched for |
| postings | Number of postings for the role whose full text mentions the term |
| share_pct | postings divided by the role's total, times 100 |
| avg_advertised_salary_inr | Adzuna's average advertised yearly salary in rupees, only on `total` rows. Includes their estimates |
| fetched_on | Date I collected it |

## candidate_skills.csv

The example candidate: one row per skill with `have` set to Yes or No. Change it to try your own skills.

## india_data_analyst_jobs.csv

212 recent data analyst type postings (June to November 2026), one row each, after cleaning.

| Column | What it means |
|---|---|
| job_id, title, company, city | From the posting |
| posted_date, posted_month | When it was posted |
| role_group | My grouping of the title (data analyst, BI analyst / developer, business analyst ...) |
| seniority | Entry level, Mid / not stated, or Senior / lead / manager, from the title |
| city_group | The top cities, everything else as "Other cities" |
| work_mode | Remote / WFH, Hybrid, or Not stated, from the text |
| experience_years_min | Smallest number of years asked for, if the text says |
| salary_lpa | Stated yearly salary in lakh rupees (middle of the range), only when it looked believable |
| skills_found | How many of my skills appear in the first 500 characters |
| SQL, Excel, Power BI ... | True if that skill appears in the first 500 characters |

## india_job_skills.csv

The same 212 postings in long format: one row per posting and skill found. The SQL queries use it for joins.
