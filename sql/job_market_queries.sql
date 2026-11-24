-- Data analyst job market in India: SQL queries (SQLite syntax)
--
-- Tables (load the CSV files in data/):
--   jobs          <- data/india_data_analyst_jobs.csv   one row per recent posting (212 rows)
--   job_skills    <- data/india_job_skills.csv          one row per posting and skill found in its text
--   role_demand   <- data/role_skill_demand.csv         full-text skill counts for 10 roles (kind = total | skill | work arrangement)
--   candidate_skills <- data/candidate_skills.csv       my own skills (have = Yes / No)
--
-- The results I got are in the comments.

-- 1. How big is the sample and what dates does it cover?
-- Expect: 212 postings, 2026-06-13 to 2026-11-24, 170 distinct employers
SELECT COUNT(*)                   AS postings,
       MIN(posted_date)           AS first_posted,
       MAX(posted_date)           AS last_posted,
       COUNT(DISTINCT company)    AS employers
FROM jobs;

-- 2. What kinds of roles are advertised? (window function for the share of the total)
-- Expect: Data analyst 131 (61.8%), BI analyst / developer 61 (28.8%), Business analyst 9 ...
SELECT role_group,
       COUNT(*) AS postings,
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS share_pct
FROM jobs
GROUP BY role_group
ORDER BY postings DESC;

-- 3. Seniority mix inside each role group (CASE + conditional counting)
SELECT role_group,
       SUM(seniority = 'Entry level')             AS entry_level,
       SUM(seniority = 'Mid / not stated')        AS mid_or_not_stated,
       SUM(seniority = 'Senior / lead / manager') AS senior,
       COUNT(*)                                   AS total
FROM jobs
GROUP BY role_group
ORDER BY total DESC;

-- 4. Which cities hire the most? (cities with at least 5 postings)
-- Expect: India (not specified) 92, Bangalore 52, Hyderabad 18, Pune 11 ...
SELECT city, COUNT(*) AS postings
FROM jobs
GROUP BY city
HAVING COUNT(*) >= 5
ORDER BY postings DESC;

-- 5. Which employers post the most analyst jobs?
-- Expect: EXL 6, Amazon 5, Applied Materials 4, Genl Mills India Priv 4 ...
SELECT company, COUNT(*) AS postings
FROM jobs
GROUP BY company
HAVING COUNT(*) >= 3
ORDER BY postings DESC, company;

-- 6. Skills found in the recent sample, with the share of all postings
--    (I only have the first 500 characters of each advert, so these are lower than the real numbers)
SELECT js.skill,
       COUNT(DISTINCT js.job_id) AS postings,
       ROUND(100.0 * COUNT(DISTINCT js.job_id) / (SELECT COUNT(*) FROM jobs), 1) AS share_pct
FROM job_skills js
GROUP BY js.skill
ORDER BY postings DESC
LIMIT 10;

-- 7. Do senior roles ask for different skills? (join + CASE)
-- Compares the share of senior and non-senior postings that mention each skill
SELECT js.skill,
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN j.seniority = 'Senior / lead / manager' THEN j.job_id END)
             / (SELECT COUNT(*) FROM jobs WHERE seniority = 'Senior / lead / manager'), 1) AS senior_pct,
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN j.seniority <> 'Senior / lead / manager' THEN j.job_id END)
             / (SELECT COUNT(*) FROM jobs WHERE seniority <> 'Senior / lead / manager'), 1) AS other_pct
FROM job_skills js
JOIN jobs j ON j.job_id = js.job_id
GROUP BY js.skill
HAVING COUNT(DISTINCT js.job_id) >= 8
ORDER BY senior_pct DESC;

-- 8. Which pairs of skills are asked for together? (self join)
SELECT a.skill AS skill_1, b.skill AS skill_2, COUNT(*) AS postings
FROM job_skills a
JOIN job_skills b ON a.job_id = b.job_id AND a.skill < b.skill
GROUP BY a.skill, b.skill
ORDER BY postings DESC
LIMIT 8;

-- 9. Full-text skill demand across 938 postings titled "data analyst", ranked (RANK window function)
-- Expect: SQL 66.7%, Python 45.5%, Excel 44.7%, Power BI 36.1%, statistics 34.4%, Tableau 29.2%, ETL 19.5%, machine learning 16.3%
SELECT RANK() OVER (ORDER BY postings DESC) AS rank,
       term AS skill, postings, share_pct
FROM role_demand
WHERE role = 'data analyst' AND kind = 'skill'
ORDER BY rank;

-- 10. Power BI against Tableau (CTE)
-- Expect: Power BI 339, Tableau 274, ratio 1.24
WITH tools AS (
    SELECT term AS skill, postings FROM role_demand
    WHERE role = 'data analyst' AND kind = 'skill' AND term IN ('Power BI', 'Tableau')
)
SELECT MAX(CASE WHEN skill = 'Power BI' THEN postings END) AS power_bi,
       MAX(CASE WHEN skill = 'Tableau'  THEN postings END) AS tableau,
       ROUND(1.0 * MAX(CASE WHEN skill = 'Power BI' THEN postings END)
                 / MAX(CASE WHEN skill = 'Tableau'  THEN postings END), 2) AS power_bi_per_tableau
FROM tools;

-- 11. Median stated salary by seniority, in lakh rupees a year
--     (SQLite has no MEDIAN, so I rank the rows and take the middle one)
WITH ranked AS (
    SELECT seniority, salary_lpa,
           ROW_NUMBER() OVER (PARTITION BY seniority ORDER BY salary_lpa) AS rn,
           COUNT(*)     OVER (PARTITION BY seniority)                     AS n
    FROM jobs
    WHERE salary_lpa IS NOT NULL
)
SELECT seniority, MAX(n) AS postings_with_salary, ROUND(AVG(salary_lpa), 1) AS median_lakh
FROM ranked
WHERE rn IN ((n + 1) / 2, (n + 2) / 2)
GROUP BY seniority;

-- 12. Remote and work-from-home postings
-- Expect: 11 postings
SELECT title, company, city, posted_date
FROM jobs
WHERE work_mode = 'Remote / WFH'
ORDER BY posted_date DESC;

-- ---------------------------------------------------------------------------
-- Part 2: all ten roles (role_demand) and the skill gap check
-- ---------------------------------------------------------------------------

-- 13. Roles ranked by postings with the role in the title (RANK window)
-- Expect: 1 sales executive 3582, 2 software developer 3072, 3 product manager 2570, 4 accountant 2498,
--         5 project manager 2215, 6 business analyst 1660, 7 data scientist 1642, 8 digital marketing 1026,
--         9 data analyst 938, 10 hr executive 680
SELECT RANK() OVER (ORDER BY postings DESC) AS rank, role, postings
FROM role_demand
WHERE kind = 'total'
ORDER BY rank;

-- 14. Top 3 skills per role (ROW_NUMBER, partitioned by role)
-- Expect: 30 rows. Data analyst: SQL 66.7, Python 45.5, Excel 44.7. Data scientist: Python 82.8,
--         machine learning 77.9, statistics 65.5. Business analyst: requirements 89.8, Agile 38.7, Excel 35.4.
--         Sales executive: communication 66.3, negotiation 42.9, lead generation 38.7
SELECT role, rn AS rank, term AS skill, share_pct
FROM (SELECT role, term, share_pct,
             ROW_NUMBER() OVER (PARTITION BY role ORDER BY share_pct DESC, term) AS rn
      FROM role_demand
      WHERE kind = 'skill')
WHERE rn <= 3
ORDER BY role, rn;

-- 15. Skills in 5 or more roles (GROUP BY / HAVING)
-- Expect: Excel in 8 roles (average share 29.7%), SQL in 6 roles (32.4%). No other skill is in 5 or more roles.
SELECT term AS skill, COUNT(DISTINCT role) AS roles, ROUND(AVG(share_pct), 1) AS avg_share_pct
FROM role_demand
WHERE kind = 'skill'
GROUP BY term
HAVING COUNT(DISTINCT role) >= 5
ORDER BY roles DESC, term;

-- 16. SQL share by role (roles that have SQL in their skill list)
-- Expect: data analyst 66.7, data scientist 55.7, business analyst 34.4, software developer 22.8,
--         product manager 13.0, accountant 1.9 (6 roles; the others have no SQL in their skill list)
SELECT role, postings, share_pct
FROM role_demand
WHERE kind = 'skill' AND term = 'SQL'
ORDER BY share_pct DESC;

-- 17. Remote and work-from-home mention share by role
-- Expect: data analyst 13.4 / 4.8, data scientist 9.7 / 4.8, product manager 9.1 / 5.4 ... hr executive 3.7 / 1.8
--         (remote % / work from home %). These are keyword mentions that overlap, not confirmed remote jobs
SELECT role,
       MAX(CASE WHEN term = 'remote'         THEN share_pct END) AS remote_pct,
       MAX(CASE WHEN term = 'work from home' THEN share_pct END) AS wfh_pct
FROM role_demand
WHERE kind = 'work arrangement'
GROUP BY role
ORDER BY remote_pct DESC;

-- 18. Skill gap for my own skills, in pure SQL
--     I take each role's top 8 skills (ROW_NUMBER) and LEFT JOIN the candidate's skills,
--     coverage = SUM(share of skills the candidate has) / SUM(share of all 8 skills).
--     Same numbers as notebooks/job_market_by_role.ipynb and analysis/skill_gap.py.
-- Expect: data analyst 90.0, software developer 77.5, data scientist 68.5, business analyst 52.6,
--         accountant 37.8, product manager 25.1, project manager 22.6, hr executive 10.1,
--         sales executive 5.7, digital marketing 3.2
WITH top_skills AS (
    SELECT role, term, share_pct
    FROM (SELECT role, term, share_pct,
                 ROW_NUMBER() OVER (PARTITION BY role ORDER BY share_pct DESC, term) AS rn
          FROM role_demand
          WHERE kind = 'skill')
    WHERE rn <= 8
)
SELECT t.role,
       ROUND(100.0 * SUM(CASE WHEN c.have = 'Yes' THEN t.share_pct ELSE 0 END) / SUM(t.share_pct), 1) AS coverage_pct,
       SUM(c.have = 'Yes') AS skills_have,
       COUNT(*)            AS skills_checked
FROM top_skills t
LEFT JOIN candidate_skills c ON LOWER(c.skill) = LOWER(t.term)
GROUP BY t.role
ORDER BY coverage_pct DESC;

-- 19. Missing skills among a role's top 8, most in demand first (change the role name to try another)
-- Expect: deep learning 43.4, AWS 32.7, NLP 27.5, TensorFlow 25.8 (coverage for this role: 68.5%)
SELECT t.term AS missing_skill, t.share_pct
FROM (SELECT role, term, share_pct,
             ROW_NUMBER() OVER (PARTITION BY role ORDER BY share_pct DESC, term) AS rn
      FROM role_demand
      WHERE kind = 'skill') t
LEFT JOIN candidate_skills c ON LOWER(c.skill) = LOWER(t.term)
WHERE t.role = 'data scientist' AND t.rn <= 8 AND COALESCE(c.have, 'No') = 'No'
ORDER BY t.share_pct DESC;
