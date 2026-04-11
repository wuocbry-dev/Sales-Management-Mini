/** Khớp `BranchDtos` — JSON camelCase. */

export type BranchRequest = {
  branchCode: string;
  branchName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: string;
};

export type BranchResponse = {
  branchId: number;
  storeId: number;
  branchCode: string;
  branchName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
};
