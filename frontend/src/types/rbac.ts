/** Khớp backend `RbacDtos`. */

export type RoleListRow = {
  id: number;
  roleCode: string;
  roleName: string;
  description: string | null;
};

export type PermissionListRow = {
  id: number;
  permissionCode: string;
  permissionName: string;
  moduleName: string | null;
  actionName: string | null;
};

export type PermissionOverrideRow = {
  overrideId: number;
  roleId: number;
  permissionId: number;
  permissionCode: string;
  storeId: number | null;
  branchId: number | null;
  overrideType: string;
};

export type CreatePermissionOverrideRequestBody = {
  roleId: number;
  permissionId: number;
  storeId?: number | null;
  branchId?: number | null;
  overrideType: string;
};
