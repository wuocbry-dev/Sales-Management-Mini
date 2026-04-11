import type { MeResponse } from "@/types/auth";

/** Quản trị cấp hệ thống — khớp `AuthorizationExpressions.systemManage` (SYSTEM_ADMIN hoặc ADMIN). */
export function isSystemLevelUser(me: MeResponse | null): boolean {
  if (!me?.roles?.length) return false;
  return me.roles.includes("SYSTEM_ADMIN") || me.roles.includes("ADMIN");
}

export function hasPermission(me: MeResponse | null, code: string): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return true;
  return me.permissions?.includes(code) ?? false;
}

export function hasAnyPermission(me: MeResponse | null, codes: readonly string[]): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return true;
  return codes.some((c) => me.permissions?.includes(c));
}

export function hasRole(me: MeResponse | null, role: string): boolean {
  return me?.roles?.includes(role) ?? false;
}

/** Khớp `@authz.masterRead` trên backend. */
export function hasMasterRead(me: MeResponse | null): boolean {
  return hasAnyPermission(me, [
    "PRODUCT_VIEW",
    "INVENTORY_VIEW",
    "INVENTORY_TRANSACTION_VIEW",
    "GOODS_RECEIPT_VIEW",
    "GOODS_RECEIPT_CREATE",
    "ORDER_VIEW",
    "ORDER_CREATE",
    "STORE_VIEW",
  ]);
}

export function hasStoreScope(me: MeResponse | null, storeId: number): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return true;
  return me.storeIds?.includes(storeId) ?? false;
}

export function hasBranchScope(me: MeResponse | null, branchId: number): boolean {
  if (!me) return false;
  if (isSystemLevelUser(me)) return true;
  return me.branchIds?.includes(branchId) ?? false;
}
