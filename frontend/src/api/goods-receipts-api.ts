import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { GoodsReceiptCreateRequestBody, GoodsReceiptResponse } from "@/types/goods-receipt";
import type { SpringPage } from "@/types/spring-page";

export type GoodsReceiptListParams = PageQuery & {
  storeId?: number;
  status?: string;
  fromReceiptDate?: string;
  toReceiptDate?: string;
};

export async function fetchGoodsReceiptsPage(params: GoodsReceiptListParams): Promise<SpringPage<GoodsReceiptResponse>> {
  const { page, size, sort, storeId, status, fromReceiptDate, toReceiptDate } = params;
  const q: Record<string, string | number> = { page, size };
  if (sort) q.sort = sort;
  if (storeId != null) q.storeId = storeId;
  if (status) q.status = status;
  if (fromReceiptDate) q.fromReceiptDate = fromReceiptDate;
  if (toReceiptDate) q.toReceiptDate = toReceiptDate;
  const { data } = await apiClient.get<SpringPage<GoodsReceiptResponse>>("/api/goods-receipts", { params: q });
  return data;
}

export async function fetchGoodsReceiptById(id: number): Promise<GoodsReceiptResponse> {
  const { data } = await apiClient.get<GoodsReceiptResponse>(`/api/goods-receipts/${id}`);
  return data;
}

export async function createGoodsReceiptDraft(body: GoodsReceiptCreateRequestBody): Promise<GoodsReceiptResponse> {
  const { data } = await apiClient.post<GoodsReceiptResponse>("/api/goods-receipts", body);
  return data;
}

export async function confirmGoodsReceipt(id: number): Promise<GoodsReceiptResponse> {
  const { data } = await apiClient.post<GoodsReceiptResponse>(`/api/goods-receipts/${id}/confirm`);
  return data;
}
