# Power BI dashboard

A three-page dashboard built from the cleaned CSV files in `../data/`:

1. **Skills in demand**: how many India "data analyst" postings mention each skill (938 postings)
2. **Market snapshot**: roles, seniority, cities and months for 212 recent postings
3. **Remote work and pay**: remote, work-from-home and hybrid mentions, salary and the remote postings I found

## Open the project

1. Open `JobMarket.pbip` in Power BI Desktop (switch on *Power BI Project* files under Options > Preview features if asked).
2. In `JobMarket.SemanticModel/definition/expressions.tmdl`, set `DataFolder` to the full path of the `data` folder on your machine.
3. Click **Refresh**.

## How it is built

- **Two tables:** `jobs` (one row per recent posting) and `skill_demand` (the full-text skill counts). They are not linked, because each page uses one of them.
- **Measures (DAX):** recent postings, postings with a salary, median salary, remote postings, senior share, median experience, skill share, postings mentioning a skill, and the SQL, Power BI, Tableau, remote, work-from-home and hybrid shares.
- **Filters:** the skills chart uses only `type = skill`, and the remote table uses only `work_mode = Remote / WFH`.
- Colours match the other projects in this profile (soft blue, sage and coral).
