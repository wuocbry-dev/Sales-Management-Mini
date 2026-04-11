/** Khớp backend `UserDtos` nhân viên cửa hàng. */

export type CreateStoreStaffRequestBody = {
  username: string;
  password: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  roleCode: string;
  branchId: number;
  status?: string | null;
};

export type StoreStaffRow = {
  userId: number;
  username: string;
  fullName: string;
  roleCode: string;
  storeId: number;
  branchId: number;
  status: string;
  createdAt: string;
};

export type ChangeStoreStaffBranchRequestBody = {
  newBranchId: number;
};

export type ChangeStoreStaffBranchResult = {
  userId: number;
  username: string;
  fullName: string;
  roleCode: string;
  storeId: number;
  oldBranchId: number;
  newBranchId: number;
  status: string;
  updatedAt: string;
};
