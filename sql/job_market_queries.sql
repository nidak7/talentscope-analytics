-- Data analyst job market in India: SQL queries (SQLite syntax)
--
-- Tables (load the CSV files in data/):
--   jobs          <- data/india_data_analyst_jobs.csv   one row per recent posting (212 rows)
--   job_skills    <- data/india_job_skills.csv          one row per posting and skill found in its text
--   skill_demand  <- data/skill_demand_counts.csv       full-text counts for the 938 postings titled "data analyst"
--
-- The results I got are written in the comments.

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
--    (only the first 500 characters of each advert are available, so this is a lower bound)
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
-- Expect: SQL 66.7%, Python 45.5%, Excel 44.7%, Power BI 36.1%, statistics 34.4%, Tableau 29.2% ...
SELECT RANK() OVER (ORDER BY postings DESC) AS rank,
       skill, postings, share_pct
FROM skill_demand
WHERE type = 'skill'
ORDER BY rank;

-- 10. Power BI against Tableau (CTE)
-- Expect: Power BI 339, Tableau 274, ratio 1.24
WITH tools AS (
    SELECT skill, postings FROM skill_demand WHERE skill IN ('Power BI', 'Tableau')
)
SELECT MAX(CASE WHEN skill = 'Power BI' THEN postings END) AS power_bi,
       MAX(CASE WHEN skill = 'Tableau'  THEN postings END) AS tableau,
       ROUND(1.0 * MAX(CASE WHEN skill = 'Power BI' THEN postings END)
                 / MAX(CASE WHEN skill = 'Tableau'  THEN postings END), 2) AS power_bi_per_tableau
FROM tools;

-- 11. Median stated salary by seniority, in lakh rupees a year
--     (SQLite has no MEDIAN, so rank the rows and take the middle one)
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
