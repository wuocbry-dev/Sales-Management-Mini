import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { ProductCreateRequestBody, ProductResponse, ProductVariantOptionResponse } from "@/types/product";
import type { SpringPage } from "@/types/spring-page";

export type ProductListParams = PageQuery & {
  status?: string;
  categoryId?: number;
  brandId?: number;
  q?: string;
};

export async function fetchProductsPage(params: ProductListParams): Promise<SpringPage<ProductResponse>> {
  const { page, size, sort, status, categoryId, brandId, q } = params;
  const query: Record<string, string | number> = { page, size };
  if (sort) query.sort = sort;
  if (status) query.status = status;
  if (categoryId != null) query.categoryId = categoryId;
  if (brandId != null) query.brandId = brandId;
  if (q != null && q.trim() !== "") query.q = q.trim();
  const { data } = await apiClient.get<SpringPage<ProductResponse>>("/api/products", { params: query });
  return data;
}

export async function fetchProductById(id: number): Promise<ProductResponse> {
  const { data } = await apiClient.get<ProductResponse>(`/api/products/${id}`);
  return data;
}

export async function fetchProductVariantSearch(params: {
  storeId: number;
  q: string;
}): Promise<ProductVariantOptionResponse[]> {
  const q = params.q.trim();
  if (!q) return [];
  const { data } = await apiClient.get<ProductVariantOptionResponse[]>("/api/products/variant-search", {
    params: { storeId: params.storeId, q },
  });
  return data;
}

export async function createProduct(body: ProductCreateRequestBody): Promise<ProductResponse> {
  const { data } = await apiClient.post<ProductResponse>("/api/products", body);
  return data;
}
