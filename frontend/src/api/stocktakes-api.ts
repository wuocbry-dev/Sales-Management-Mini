import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { StocktakeCreateRequestBody, StocktakeResponse } from "@/types/stocktake";
import type { SpringPage } from "@/types/spring-page";

export type StocktakeListParams = PageQuery & {
  storeId?: number;
  status?: string;
};

export async function fetchStocktakesPage(params: StocktakeListParams): Promise<SpringPage<StocktakeResponse>> {
  const { page, size, sort, storeId, status } = params;
  const q: Record<string, string | number> = { page, size };
  if (sort) q.sort = sort;
  if (storeId != null) q.storeId = storeId;
  if (status) q.status = status;
  const { data } = await apiClient.get<SpringPage<StocktakeResponse>>("/api/stocktakes", { params: q });
  return data;
}

export async function fetchStocktakeById(id: number): Promise<StocktakeResponse> {
  const { data } = await apiClient.get<StocktakeResponse>(`/api/stocktakes/${id}`);
  return data;
}

export async function createStocktakeDraft(body: StocktakeCreateRequestBody): Promise<StocktakeResponse> {
  const { data } = await apiClient.post<StocktakeResponse>("/api/stocktakes", body);
  return data;
}

export async function confirmStocktake(id: number): Promise<StocktakeResponse> {
  const { data } = await apiClient.post<StocktakeResponse>(`/api/stocktakes/${id}/confirm`);
  return data;
}
