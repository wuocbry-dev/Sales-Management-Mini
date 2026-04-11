import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { BranchRequest, BranchResponse } from "@/types/branch";
import type { SpringPage } from "@/types/spring-page";

export async function fetchBranchesForStore(storeId: number, q: PageQuery): Promise<SpringPage<BranchResponse>> {
  const { data } = await apiClient.get<SpringPage<BranchResponse>>(`/api/stores/${storeId}/branches`, { params: q });
  return data;
}

export async function fetchBranchByStore(storeId: number, branchId: number): Promise<BranchResponse> {
  const { data } = await apiClient.get<BranchResponse>(`/api/stores/${storeId}/branches/${branchId}`);
  return data;
}

/** Chi tiết theo mã — khớp `GET /api/branches/{branchId}`. */
export async function fetchBranchById(branchId: number): Promise<BranchResponse> {
  const { data } = await apiClient.get<BranchResponse>(`/api/branches/${branchId}`);
  return data;
}

export async function createBranch(storeId: number, body: BranchRequest): Promise<BranchResponse> {
  const { data } = await apiClient.post<BranchResponse>(`/api/stores/${storeId}/branches`, body);
  return data;
}

/** Cập nhật theo mã — khớp `PUT /api/branches/{branchId}`. */
export async function updateBranchById(branchId: number, body: BranchRequest): Promise<BranchResponse> {
  const { data } = await apiClient.put<BranchResponse>(`/api/branches/${branchId}`, body);
  return data;
}
