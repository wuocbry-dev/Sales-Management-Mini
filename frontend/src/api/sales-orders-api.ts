import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type {
  SalesOrderConfirmRequestBody,
  SalesOrderCreateRequestBody,
  SalesOrderResponse,
} from "@/types/sales-order";
import type { SpringPage } from "@/types/spring-page";

export async function fetchSalesOrdersPage(q: PageQuery): Promise<SpringPage<SalesOrderResponse>> {
  const { data } = await apiClient.get<SpringPage<SalesOrderResponse>>("/api/sales-orders", { params: q });
  return data;
}

export async function fetchSalesOrderById(id: number): Promise<SalesOrderResponse> {
  const { data } = await apiClient.get<SalesOrderResponse>(`/api/sales-orders/${id}`);
  return data;
}

export async function createSalesOrderDraft(body: SalesOrderCreateRequestBody): Promise<SalesOrderResponse> {
  const { data } = await apiClient.post<SalesOrderResponse>("/api/sales-orders", body);
  return data;
}

export async function confirmSalesOrder(id: number, body: SalesOrderConfirmRequestBody): Promise<SalesOrderResponse> {
  const { data } = await apiClient.post<SalesOrderResponse>(`/api/sales-orders/${id}/confirm`, body);
  return data;
}

export async function cancelSalesOrder(id: number): Promise<SalesOrderResponse> {
  const { data } = await apiClient.post<SalesOrderResponse>(`/api/sales-orders/${id}/cancel`);
  return data;
}
