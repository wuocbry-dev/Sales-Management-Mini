import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SpringPage } from "@/types/spring-page";
import type { StoreRequest, StoreResponse } from "@/types/master-data";

export async function fetchStoresPage(q: PageQuery): Promise<SpringPage<StoreResponse>> {
  const { data } = await apiClient.get<SpringPage<StoreResponse>>("/api/stores", { params: q });
  return data;
}

export async function fetchStoreById(id: number): Promise<StoreResponse> {
  const { data } = await apiClient.get<StoreResponse>(`/api/stores/${id}`);
  return data;
}

export async function createStore(body: StoreRequest): Promise<StoreResponse> {
  const { data } = await apiClient.post<StoreResponse>("/api/stores", body);
  return data;
}

export async function updateStore(id: number, body: StoreRequest): Promise<StoreResponse> {
  const { data } = await apiClient.put<StoreResponse>(`/api/stores/${id}`, body);
  return data;
}
