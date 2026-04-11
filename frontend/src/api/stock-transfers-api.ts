import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { StockTransferCreateRequestBody, StockTransferResponse } from "@/types/stock-transfer";
import type { SpringPage } from "@/types/spring-page";

export type StockTransferListParams = PageQuery & {
  fromWarehouseId?: number;
  toWarehouseId?: number;
  status?: string;
};

export async function fetchStockTransfersPage(params: StockTransferListParams): Promise<SpringPage<StockTransferResponse>> {
  const { page, size, sort, fromWarehouseId, toWarehouseId, status } = params;
  const q: Record<string, string | number> = { page, size };
  if (sort) q.sort = sort;
  if (fromWarehouseId != null) q.fromWarehouseId = fromWarehouseId;
  if (toWarehouseId != null) q.toWarehouseId = toWarehouseId;
  if (status) q.status = status;
  const { data } = await apiClient.get<SpringPage<StockTransferResponse>>("/api/stock-transfers", { params: q });
  return data;
}

export async function fetchStockTransferById(id: number): Promise<StockTransferResponse> {
  const { data } = await apiClient.get<StockTransferResponse>(`/api/stock-transfers/${id}`);
  return data;
}

export async function createStockTransferDraft(body: StockTransferCreateRequestBody): Promise<StockTransferResponse> {
  const { data } = await apiClient.post<StockTransferResponse>("/api/stock-transfers", body);
  return data;
}

export async function sendStockTransfer(id: number): Promise<StockTransferResponse> {
  const { data } = await apiClient.post<StockTransferResponse>(`/api/stock-transfers/${id}/send`);
  return data;
}

export async function receiveStockTransfer(id: number): Promise<StockTransferResponse> {
  const { data } = await apiClient.post<StockTransferResponse>(`/api/stock-transfers/${id}/receive`);
  return data;
}
