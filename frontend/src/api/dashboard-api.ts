import { apiClient } from "@/lib/axios-client";
import type { DashboardKpisResponse } from "@/types/dashboard";

export async function getDashboardKpis(): Promise<DashboardKpisResponse> {
  const { data } = await apiClient.get<DashboardKpisResponse>("/api/dashboard/kpis");
  return data;
}
