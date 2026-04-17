import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { CategoryRequest, CategoryResponse } from "@/types/master-data";
import type { SpringPage } from "@/types/spring-page";

export type CategoryPageQuery = PageQuery & { storeId?: number };

export async function fetchCategoriesPage(q: CategoryPageQuery): Promise<SpringPage<CategoryResponse>> {
  const { data } = await apiClient.get<SpringPage<CategoryResponse>>("/api/categories", { params: q });
  return data;
}

export async function fetchCategoryById(id: number): Promise<CategoryResponse> {
  const { data } = await apiClient.get<CategoryResponse>(`/api/categories/${id}`);
  return data;
}

export async function createCategory(body: CategoryRequest): Promise<CategoryResponse> {
  const { data } = await apiClient.post<CategoryResponse>("/api/categories", body);
  return data;
}

export async function updateCategory(id: number, body: CategoryRequest): Promise<CategoryResponse> {
  const { data } = await apiClient.put<CategoryResponse>(`/api/categories/${id}`, body);
  return data;
}
