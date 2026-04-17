import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SupplierRequest, SupplierResponse } from "@/types/master-data";
import type { SpringPage } from "@/types/spring-page";

export type SupplierPageQuery = PageQuery & { storeId?: number };

export async function fetchSuppliersPage(q: SupplierPageQuery): Promise<SpringPage<SupplierResponse>> {
  const { data } = await apiClient.get<SpringPage<SupplierResponse>>("/api/suppliers", { params: q });
  return data;
}

export async function fetchSupplierById(id: number): Promise<SupplierResponse> {
  const { data } = await apiClient.get<SupplierResponse>(`/api/suppliers/${id}`);
  return data;
}

export async function createSupplier(body: SupplierRequest): Promise<SupplierResponse> {
  const { data } = await apiClient.post<SupplierResponse>("/api/suppliers", body);
  return data;
}

export async function updateSupplier(id: number, body: SupplierRequest): Promise<SupplierResponse> {
  const { data } = await apiClient.put<SupplierResponse>(`/api/suppliers/${id}`, body);
  return data;
}
