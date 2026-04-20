import { apiClient } from "@/lib/axios-client";
import type { DashboardKpisResponse, DashboardPeriod } from "@/types/dashboard";

export async function getDashboardKpis(period: DashboardPeriod = "month"): Promise<DashboardKpisResponse> {
  const { data } = await apiClient.get<DashboardKpisResponse>("/api/dashboard/kpis", {
    params: { period },
  });
  return data;
}
