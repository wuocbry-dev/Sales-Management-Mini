import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { BrandRequest, BrandResponse } from "@/types/master-data";
import type { SpringPage } from "@/types/spring-page";

export async function fetchBrandsPage(q: PageQuery): Promise<SpringPage<BrandResponse>> {
  const { data } = await apiClient.get<SpringPage<BrandResponse>>("/api/brands", { params: q });
  return data;
}

export async function fetchBrandById(id: number): Promise<BrandResponse> {
  const { data } = await apiClient.get<BrandResponse>(`/api/brands/${id}`);
  return data;
}

export async function createBrand(body: BrandRequest): Promise<BrandResponse> {
  const { data } = await apiClient.post<BrandResponse>("/api/brands", body);
  return data;
}

export async function updateBrand(id: number, body: BrandRequest): Promise<BrandResponse> {
  const { data } = await apiClient.put<BrandResponse>(`/api/brands/${id}`, body);
  return data;
}
