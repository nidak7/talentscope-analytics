import { CheckCircle2, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeSkillGap } from "../lib/api-client";
import { pluralize, toDisplayLabel } from "../lib/formatters";
import type { SkillGapResponse } from "../types/api";

const presetSkillSets = [
  { role: "data engineer", skills: "python, sql, docker" },
  { role: "frontend engineer", skills: "react, typescript, node.js" },
  { role: "platform engineer", skills: "aws, terraform, kubernetes" },
  { role: "data analyst", skills: "excel, tableau, power bi" }
];

export function SkillGapPage() {
  const [role, setRole] = useState("data engineer");
  const [activeRole, setActiveRole] = useState("data engineer");
  const [knownSkills, setKnownSkills] = useState("python, sql, docker");
  const [submittedSkills, setSubmittedSkills] = useState<string[]>(["python", "sql", "docker"]);
  const [result, setResult] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async (nextRole: string, skillInput: string) => {
    const skills = skillInput
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!skills.length) {
      setError("Enter at least one known skill.");
      return;
    }

    if (skills.length > 25) {
      setError("Too many skills. Keep it under 25 for a focused gap analysis.");
      return;
    }

    setLoading(true);
    setError(null);
    setActiveRole(nextRole.trim() || "overall market");
    setSubmittedSkills(skills);

    try {
      const response = await analyzeSkillGap(skills, nextRole);
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to analyze skill gap.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runAnalysis("data engineer", "python, sql, docker").catch(() => undefined);
  }, [runAnalysis]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await runAnalysis(role, knownSkills);
  }

  const coverageSummary = useMemo(() => {
    if (!result) {
      return null;
    }

    if (!result.missing_skills.length) {
      return "You already cover the strongest skills in this market slice.";
    }

    if (result.demand_score >= 60) {
      return "You already match a good part of the market. What is left looks more like refinement than a reset.";
    }

    return "There is still a noticeable gap between your current stack and the strongest demand signals.";
  }, [result]);
  const prioritySkillCount = result ? result.matched_skills.length + result.missing_skills.length : 0;
  const roundedHeat = result ? Math.round(result.market_heat_score) : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="panel p-4 sm:p-5 md:p-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/30 dark:text-brand-100">
            <Target className="h-3.5 w-3.5" />
            Skill benchmark
          </span>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">Skill Gap Analysis</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Enter your role and skills. We show what the market still expects.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-3">
          <input
            className="input-base"
            placeholder="Target role (for example: data engineer)"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
          <textarea
            className="input-base min-h-28 sm:min-h-32"
            value={knownSkills}
            onChange={(event) => setKnownSkills(event.target.value)}
            placeholder="Your skills separated by commas"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Example: `python, sql, docker`
            </p>
            <button type="submit" disabled={loading} className="cta-btn sm:min-w-[140px]">
              {loading ? "Analyzing..." : "Analyze Gap"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {presetSkillSets.map((preset) => (
            <button
              key={`${preset.role}-${preset.skills}`}
              type="button"
              className="subtle-btn !rounded-full !px-3 !py-1.5 !text-xs"
              onClick={() => {
                setRole(preset.role);
                setKnownSkills(preset.skills);
                runAnalysis(preset.role, preset.skills).catch(() => undefined);
              }}
            >
              {toDisplayLabel(preset.role)}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="panel p-5 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <section className="grid gap-3 sm:gap-4">
            <div className="panel p-4 sm:p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Gap summary</p>
              <h3 className="mt-2 break-words text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{toDisplayLabel(activeRole)}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{coverageSummary}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Coverage</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {result.matched_skills.length}/{prioritySkillCount || 0}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Demand score: {Math.round(result.demand_score)}%
                  </p>
                </div>
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Role activity</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{roundedHeat}/100</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">based on current role demand</p>
                </div>
                <div className="metric-surface p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Missing skills</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{result.missing_skills.length}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">still worth learning for this role</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="panel p-4 sm:p-5">
              <h4 className="section-title">Skills you already cover</h4>
              <p className="section-copy">Submitted skills compared against current market demand.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {submittedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {toDisplayLabel(skill)}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {result.matched_skills.length ? (
                  result.matched_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-100"
                    >
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      {toDisplayLabel(skill)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    None of the strongest market signals match yet.
                  </p>
                )}
              </div>
            </div>

            <div className="panel p-4 sm:p-5">
              <h4 className="section-title">Missing High-Demand Skills</h4>
              <p className="section-copy">These are the strongest missing signals for the selected role.</p>
              {result.missing_skills.length ? (
                <ul className="mt-4 grid gap-2 md:grid-cols-2">
                  {result.missing_skills.map((item) => (
                    <li
                      key={item.skill}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium">{toDisplayLabel(item.skill)}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {item.demand_count}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Seen in {pluralize(item.demand_count, "matching job")} for this role.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  No missing skills detected. Your current stack already aligns with the strongest signals.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
