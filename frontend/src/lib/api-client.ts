import { http } from "./http";
import type {
  DashboardStats,
  IngestionLog,
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

export async function fetchIngestionLogs(): Promise<IngestionLog[]> {
  const response = await http.get<IngestionLog[]>("/admin/ingestion-logs");
  return response.data;
}

