import { apiClient } from "@/lib/axios-client";
import type { PageQuery } from "@/lib/spring-pagination";
import type {
  CreatePermissionOverrideRequestBody,
  PermissionListRow,
  PermissionOverrideRow,
  RoleListRow,
} from "@/types/rbac";
import type { SpringPage } from "@/types/spring-page";

export async function fetchRbacRolesPage(q: PageQuery): Promise<SpringPage<RoleListRow>> {
  const { data } = await apiClient.get<SpringPage<RoleListRow>>("/api/rbac/roles", { params: q });
  return data;
}

export async function fetchRbacPermissionsPage(q: PageQuery): Promise<SpringPage<PermissionListRow>> {
  const { data } = await apiClient.get<SpringPage<PermissionListRow>>("/api/rbac/permissions", { params: q });
  return data;
}

export async function fetchPermissionOverrides(roleId?: number | null): Promise<PermissionOverrideRow[]> {
  const params: Record<string, number> = {};
  if (roleId != null && roleId > 0) params.roleId = roleId;
  const { data } = await apiClient.get<PermissionOverrideRow[]>("/api/rbac/permission-overrides", {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function createPermissionOverride(body: CreatePermissionOverrideRequestBody): Promise<PermissionOverrideRow> {
  const { data } = await apiClient.post<PermissionOverrideRow>("/api/rbac/permission-overrides", body);
  return data;
}

export async function deletePermissionOverride(id: number): Promise<void> {
  await apiClient.delete(`/api/rbac/permission-overrides/${id}`);
}
