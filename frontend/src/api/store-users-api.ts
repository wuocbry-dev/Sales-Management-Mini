import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SpringPage } from "@/types/spring-page";
import type { AssignBranchesRequestBody, UserDetail, UserListRow } from "@/types/user-admin";

export async function fetchStoreUsersPage(storeId: number, q: PageQuery): Promise<SpringPage<UserListRow>> {
  const { data } = await apiClient.get<SpringPage<UserListRow>>(`/api/stores/${storeId}/users`, { params: q });
  return data;
}

export async function assignBranchesForStoreUser(
  storeId: number,
  userId: number,
  body: AssignBranchesRequestBody,
): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/stores/${storeId}/users/${userId}/branches`, body);
  return data;
}
