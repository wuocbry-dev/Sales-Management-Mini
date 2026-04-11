/** Khớp backend `UserDtos` (JSON camelCase). */

export type UserListRow = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  defaultStoreId: number | null;
  roleCodes: string[];
};

export type RoleRow = {
  id: number;
  roleCode: string;
  roleName: string;
};

export type StoreRow = {
  storeId: number;
  storeCode: string;
  storeName: string;
  primary: boolean;
};

export type BranchRow = {
  branchId: number;
  storeId: number;
  branchCode: string;
  branchName: string;
  primary: boolean;
};

export type UserDetail = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  defaultStoreId: number | null;
  roles: RoleRow[];
  stores: StoreRow[];
  branches: BranchRow[];
};

export type CreateUserRequestBody = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  defaultStoreId?: number | null;
  roleIds: number[];
  storeIds?: number[] | null;
  primaryStoreId?: number | null;
};

export type UpdateUserRequestBody = {
  email: string;
  fullName: string;
  phone?: string | null;
  defaultStoreId?: number | null;
};

export type UpdateUserStatusRequestBody = {
  status: string;
};

export type AssignRolesRequestBody = {
  roleIds: number[];
};

export type AssignStoresRequestBody = {
  storeIds: number[];
  primaryStoreId?: number | null;
};

export type AssignBranchesRequestBody = {
  branchIds: number[];
  primaryBranchId?: number | null;
};
