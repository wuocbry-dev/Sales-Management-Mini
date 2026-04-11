import { apiClient } from "@/lib/axios-client";
import type { WarehouseResponse } from "@/types/warehouse";

export async function fetchWarehousesForStore(storeId: number): Promise<WarehouseResponse[]> {
  const { data } = await apiClient.get<WarehouseResponse[]>(`/api/stores/${storeId}/warehouses`);
  return data;
}

export async function fetchWarehouse(storeId: number, warehouseId: number): Promise<WarehouseResponse> {
  const { data } = await apiClient.get<WarehouseResponse>(`/api/stores/${storeId}/warehouses/${warehouseId}`);
  return data;
}
