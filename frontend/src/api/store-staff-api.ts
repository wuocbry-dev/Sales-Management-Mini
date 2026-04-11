import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SpringPage } from "@/types/spring-page";
import type {
  ChangeStoreStaffBranchRequestBody,
  ChangeStoreStaffBranchResult,
  CreateStoreStaffRequestBody,
  StoreStaffRow,
} from "@/types/store-staff";

export type StoreStaffListParams = PageQuery & {
  roleCode?: string;
  branchId?: number;
  status?: string;
  storeId?: number;
};

export async function fetchStoreStaffPage(params: StoreStaffListParams): Promise<SpringPage<StoreStaffRow>> {
  const { page, size, sort, roleCode, branchId, status, storeId } = params;
  const q: Record<string, string | number> = { page, size };
  if (sort) q.sort = sort;
  if (roleCode) q.roleCode = roleCode;
  if (branchId != null) q.branchId = branchId;
  if (status) q.status = status;
  if (storeId != null) q.storeId = storeId;
  const { data } = await apiClient.get<SpringPage<StoreStaffRow>>("/api/users/store-staff", { params: q });
  return data;
}

export async function fetchStoreStaffById(id: number): Promise<StoreStaffRow> {
  const { data } = await apiClient.get<StoreStaffRow>(`/api/users/store-staff/${id}`);
  return data;
}

export async function createStoreStaff(body: CreateStoreStaffRequestBody): Promise<StoreStaffRow> {
  const { data } = await apiClient.post<StoreStaffRow>("/api/users/store-staff", body);
  return data;
}

export async function changeStoreStaffBranch(
  id: number,
  body: ChangeStoreStaffBranchRequestBody,
): Promise<ChangeStoreStaffBranchResult> {
  const { data } = await apiClient.put<ChangeStoreStaffBranchResult>(`/api/users/store-staff/${id}/change-branch`, body);
  return data;
}
