import {
  hasAnyPermission,
  hasBranchScope,
  hasMasterRead,
  hasPermission,
  hasRole,
  hasStoreScope,
  isSystemLevelUser,
} from "@/lib/access-control";
import type { MeResponse } from "@/types/auth";

export {
  hasAnyPermission,
  hasBranchScope,
  hasMasterRead,
  hasPermission,
  hasRole,
  hasStoreScope,
  isSystemLevelUser,
};

/** @deprecated Dùng `isSystemLevelUser` — giữ để tương thích mã cũ. */
export const isSystemManage = isSystemLevelUser;

export function isBranchManagerRole(me: MeResponse | null): boolean {
  return hasRole(me, "BRANCH_MANAGER");
}

export function isStoreManagerRole(me: MeResponse | null): boolean {
  return hasRole(me, "STORE_MANAGER");
}

/**
 * Thu ngân (POS): vai trò CASHIER, không gồm quản trị / quản lý cửa hàng / quản lý chi nhánh.
 * Khớp ROLE_UI_MATRIX — giao diện bán hàng tập trung.
 */
export function isFrontlineCashierNav(me: MeResponse | null): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return false;
  if (isStoreManagerRole(me) || isBranchManagerRole(me)) return false;
  return hasRole(me, "CASHIER");
}

/**
 * Nhân viên kho thuần — khớp ROLE_UI_MATRIX.
 */
export function isFrontlineWarehouseNav(me: MeResponse | null): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return false;
  if (isStoreManagerRole(me) || isBranchManagerRole(me)) return false;
  return hasRole(me, "WAREHOUSE_STAFF");
}
