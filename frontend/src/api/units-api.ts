import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { UnitRequest, UnitResponse } from "@/types/master-data";
import type { SpringPage } from "@/types/spring-page";

export type UnitPageQuery = PageQuery & { storeId?: number };

export async function fetchUnitsPage(q: UnitPageQuery): Promise<SpringPage<UnitResponse>> {
  const { data } = await apiClient.get<SpringPage<UnitResponse>>("/api/units", { params: q });
  return data;
}

export async function fetchUnitById(id: number): Promise<UnitResponse> {
  const { data } = await apiClient.get<UnitResponse>(`/api/units/${id}`);
  return data;
}

export async function createUnit(body: UnitRequest): Promise<UnitResponse> {
  const { data } = await apiClient.post<UnitResponse>("/api/units", body);
  return data;
}

export async function updateUnit(id: number, body: UnitRequest): Promise<UnitResponse> {
  const { data } = await apiClient.put<UnitResponse>(`/api/units/${id}`, body);
  return data;
}

export async function deleteUnit(id: number): Promise<void> {
  await apiClient.delete(`/api/units/${id}`);
}
