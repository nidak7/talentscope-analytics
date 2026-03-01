import { http } from "./http";
import type {
  BootstrapStatus,
  DashboardStats,
  IngestionLog,
  LiveJob,
  RoleIntelligence,
  SkillGapResponse,
  SyncResponse
} from "../types/api";

export async function fetchDashboard(): Promise<DashboardStats> {
  const response = await http.get<DashboardStats>("/insights/dashboard");
  return response.data;
}

export async function fetchRoleIntelligence(title: string): Promise<RoleIntelligence> {
  const response = await http.get<RoleIntelligence>("/insights/role-intelligence", {
    params: { title }
  });
  return response.data;
}

export async function analyzeSkillGap(
  knownSkills: string[],
  role?: string
): Promise<SkillGapResponse> {
  const response = await http.post<SkillGapResponse>("/insights/skill-gap", {
    known_skills: knownSkills,
    role: role?.trim() || null
  });
  return response.data;
}

export async function triggerSync(): Promise<SyncResponse> {
  const response = await http.post<SyncResponse>("/admin/sync");
  return response.data;
}

export async function triggerBootstrapSync(): Promise<SyncResponse> {
  const response = await http.post<SyncResponse>("/insights/bootstrap-sync");
  return response.data;
}

export async function fetchIngestionLogs(): Promise<IngestionLog[]> {
  const response = await http.get<IngestionLog[]>("/admin/ingestion-logs");
  return response.data;
}

export async function fetchLiveJobs(limit = 20, title?: string): Promise<LiveJob[]> {
  const response = await http.get<LiveJob[]>("/insights/live-jobs", {
    params: { limit, title: title?.trim() || undefined }
  });
  return response.data;
}

export async function fetchBootstrapStatus(): Promise<BootstrapStatus> {
  const response = await http.get<BootstrapStatus>("/auth/bootstrap-status");
  return response.data;
}

export async function claimAdminRole() {
  const response = await http.post("/auth/claim-admin");
  return response.data;
}
