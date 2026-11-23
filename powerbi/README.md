# Power BI dashboard

A five-page dashboard built from the cleaned CSV files in `../data/`:

1. **Roles at a glance:** postings, remote mentions and rough advertised salary for the ten roles
2. **Skills by role:** pick a role and see the share of its postings that mention each skill
3. **Skill gap across roles:** how much of each role's top 8 skills the example candidate already covers
4. **Skill gap for one role:** pick a target role and see its skills, their demand and which ones the example candidate has
5. **Data analyst deep dive:** 212 recent data analyst postings (roles, cities, seniority, remote postings)

## Open the project

1. Open `JobMarket.pbip` in Power BI Desktop (switch on *Power BI Project* files under Options > Preview features if asked).
2. In `JobMarket.SemanticModel/definition/expressions.tmdl`, set `DataFolder` to the full path of the `data` folder on your machine.
3. Click **Refresh**.

To check a different candidate, edit `data/candidate_skills.csv` (set `have` to Yes or No) and refresh.

## How it is built

- **Three tables:** `role_demand` (the skill counts for the ten roles), `candidate_skills` (the example candidate) and `jobs` (the 212 data analyst postings). `role_demand` and `candidate_skills` are linked on the skill name.
- **Skill coverage (DAX):** takes a role's top 8 skills with `TOPN`, looks up whether the candidate has each one through the relationship, and divides the demand share of the skills they have by the total. It matches the Python script and the SQL query.
- **Other measures:** role postings, demand share, remote and work-from-home mention share, average advertised salary, top skill share, and (for the data analyst page) recent postings, senior share, median experience and median salary.
- **Filters:** the skill charts use only rows where `kind = skill`, and the remote table uses only `work_mode = Remote / WFH`.
- **Colours:** teal, amber and plum on a light background.
