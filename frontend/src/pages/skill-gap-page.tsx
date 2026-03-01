import { useState } from "react";
import { analyzeSkillGap } from "../lib/api-client";
import type { SkillGapResponse } from "../types/api";

export function SkillGapPage() {
  const [role, setRole] = useState("data engineer");
  const [knownSkills, setKnownSkills] = useState("python, sql, docker");
  const [result, setResult] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis(event: React.FormEvent) {
    event.preventDefault();
    const skills = knownSkills
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!skills.length) {
      setError("Enter at least one known skill");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await analyzeSkillGap(skills, role);
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to analyze skill gap");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={runAnalysis} className="panel space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Skill Gap Analyzer</h3>
        <input
          className="input-base"
          placeholder="Role (optional)"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <textarea
          className="input-base min-h-28"
          value={knownSkills}
          onChange={(event) => setKnownSkills(event.target.value)}
          placeholder="Known skills separated by commas"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
        >
          {loading ? "Analyzing..." : "Analyze Skill Gap"}
        </button>
      </form>

      {error ? (
        <div className="panel p-5 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {result ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Demand score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{result.demand_score}%</p>
          </div>
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Market Heat Score</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {result.market_heat_score}/100
            </p>
          </div>
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Matched skills</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {result.matched_skills.length ? result.matched_skills.join(", ") : "No matched skill yet"}
            </p>
          </div>

          <div className="panel p-5 md:col-span-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Missing High-Demand Skills</h4>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.missing_skills.map((item) => (
                <li
                  key={item.skill}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {item.skill} <span className="text-xs text-slate-500">({item.demand_count} mentions)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

