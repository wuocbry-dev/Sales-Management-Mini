import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SalesReturnCreateRequestBody, SalesReturnResponse } from "@/types/sales-return";
import type { SpringPage } from "@/types/spring-page";

export type SalesReturnListParams = PageQuery & {
  storeId?: number;
  orderId?: number;
  status?: string;
};

export async function fetchSalesReturnsPage(params: SalesReturnListParams): Promise<SpringPage<SalesReturnResponse>> {
  const { page, size, sort, storeId, orderId, status } = params;
  const q: Record<string, string | number> = { page, size };
  if (sort) q.sort = sort;
  if (storeId != null) q.storeId = storeId;
  if (orderId != null) q.orderId = orderId;
  if (status) q.status = status;
  const { data } = await apiClient.get<SpringPage<SalesReturnResponse>>("/api/sales-returns", { params: q });
  return data;
}

export async function fetchSalesReturnById(id: number): Promise<SalesReturnResponse> {
  const { data } = await apiClient.get<SalesReturnResponse>(`/api/sales-returns/${id}`);
  return data;
}

export async function createSalesReturnDraft(body: SalesReturnCreateRequestBody): Promise<SalesReturnResponse> {
  const { data } = await apiClient.post<SalesReturnResponse>("/api/sales-returns", body);
  return data;
}

export async function confirmSalesReturn(id: number): Promise<SalesReturnResponse> {
  const { data } = await apiClient.post<SalesReturnResponse>(`/api/sales-returns/${id}/confirm`);
  return data;
}
