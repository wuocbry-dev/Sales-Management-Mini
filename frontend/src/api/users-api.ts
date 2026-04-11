import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type { SpringPage } from "@/types/spring-page";
import type {
  AssignBranchesRequestBody,
  AssignRolesRequestBody,
  AssignStoresRequestBody,
  CreateUserRequestBody,
  UpdateUserRequestBody,
  UpdateUserStatusRequestBody,
  UserDetail,
  UserListRow,
} from "@/types/user-admin";

export async function fetchSystemUsersPage(q: PageQuery): Promise<SpringPage<UserListRow>> {
  const { data } = await apiClient.get<SpringPage<UserListRow>>("/api/users", { params: q });
  return data;
}

export async function fetchSystemUserById(id: number): Promise<UserDetail> {
  const { data } = await apiClient.get<UserDetail>(`/api/users/${id}`);
  return data;
}

export async function createSystemUser(body: CreateUserRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.post<UserDetail>("/api/users", body);
  return data;
}

export async function updateSystemUser(id: number, body: UpdateUserRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/users/${id}`, body);
  return data;
}

export async function updateSystemUserStatus(id: number, body: UpdateUserStatusRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/users/${id}/status`, body);
  return data;
}

export async function assignSystemUserRoles(id: number, body: AssignRolesRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/users/${id}/roles`, body);
  return data;
}

export async function assignSystemUserStores(id: number, body: AssignStoresRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/users/${id}/stores`, body);
  return data;
}

export async function assignSystemUserBranches(id: number, body: AssignBranchesRequestBody): Promise<UserDetail> {
  const { data } = await apiClient.put<UserDetail>(`/api/users/${id}/branches`, body);
  return data;
}
