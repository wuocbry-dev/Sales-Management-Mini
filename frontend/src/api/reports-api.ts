import { apiClient } from "@/lib/axios-client";
import type { ReportSummaryResponse } from "@/types/report-summary";

export async function fetchReportSummary(): Promise<ReportSummaryResponse> {
  const { data } = await apiClient.get<ReportSummaryResponse>("/api/reports/summary");
  return data;
}
