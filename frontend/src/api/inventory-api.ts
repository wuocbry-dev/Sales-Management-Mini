import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type {
  InventoryAvailabilityResponse,
  InventoryResponse,
  InventoryTransactionResponse,
} from "@/types/inventory";
import type { SpringPage } from "@/types/spring-page";

export async function fetchInventoriesByWarehouse(
  warehouseId: number,
  q: PageQuery,
): Promise<SpringPage<InventoryResponse>> {
  const { data } = await apiClient.get<SpringPage<InventoryResponse>>("/api/inventories", {
    params: { warehouseId, page: q.page, size: q.size, ...(q.sort ? { sort: q.sort } : {}) },
  });
  return data;
}

export async function fetchInventoriesByStore(storeId: number, q: PageQuery): Promise<SpringPage<InventoryResponse>> {
  const { data } = await apiClient.get<SpringPage<InventoryResponse>>("/api/inventories", {
    params: { storeId, page: q.page, size: q.size, ...(q.sort ? { sort: q.sort } : {}) },
  });
  return data;
}

export async function fetchInventoryAvailability(
  storeId: number,
  variantId: number,
): Promise<InventoryAvailabilityResponse> {
  const { data } = await apiClient.get<InventoryAvailabilityResponse>("/api/inventories/availability", {
    params: { storeId, variantId },
  });
  return data;
}

export type InventoryTransactionsParams = PageQuery & {
  warehouseId: number;
  transactionType?: string;
  variantId?: number;
  fromCreatedAt?: string;
  toCreatedAt?: string;
};

export async function fetchInventoryTransactionsPage(
  params: InventoryTransactionsParams,
): Promise<SpringPage<InventoryTransactionResponse>> {
  const { warehouseId, page, size, sort, transactionType, variantId, fromCreatedAt, toCreatedAt } = params;
  const query: Record<string, string | number> = { warehouseId, page, size };
  if (sort) query.sort = sort;
  if (transactionType) query.transactionType = transactionType;
  if (variantId != null) query.variantId = variantId;
  if (fromCreatedAt) query.fromCreatedAt = fromCreatedAt;
  if (toCreatedAt) query.toCreatedAt = toCreatedAt;
  const { data } = await apiClient.get<SpringPage<InventoryTransactionResponse>>("/api/inventory-transactions", {
    params: query,
  });
  return data;
}
