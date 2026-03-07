export type User = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
};

export type AuthSession = {
  token: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
  user: User;
};

export type BootstrapStatus = {
  has_users: boolean;
  has_admin: boolean;
  first_user_will_be_admin: boolean;
};

export type SkillCount = {
  skill: string;
  count: number;
};

export type SalaryBin = {
  band: string;
  count: number;
};

export type TrendPoint = {
  date: string;
  count: number;
};

export type DashboardStats = {
  total_jobs: number;
  top_skills: SkillCount[];
  salary_distribution: SalaryBin[];
  remote_ratio: {
    remote: number;
    onsite: number;
    hybrid_or_unknown: number;
  };
  hiring_trend: TrendPoint[];
  market_heat_score: number;
};

export type RoleIntelligence = {
  role: string;
  total_jobs: number;
  salary: {
    min: number | null;
    max: number | null;
    median: number | null;
  };
  top_skills: SkillCount[];
  top_locations: SkillCount[];
  hiring_trend: TrendPoint[];
  market_heat_score: number;
};

export type SkillGapResponse = {
  matched_skills: string[];
  missing_skills: Array<{ skill: string; demand_count: number }>;
  demand_score: number;
  market_heat_score: number;
};

export type SyncResponse = {
  status: string;
  jobs_processed: number;
  errors: string[];
  started_at: string;
  ended_at?: string | null;
};

export type SyncRequest = {
  country?: string;
  max_jobs?: number;
  reset_existing?: boolean;
};

export type IngestionLog = {
  id: string;
  source: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  triggered_by?: string | null;
  jobs_processed: number;
  errors: string[];
};

export type ResetResponse = {
  jobs_deleted: number;
  logs_deleted: number;
};

export type LiveJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  is_remote: boolean;
  posted_date: string;
  url: string;
  skills: string[];
};
