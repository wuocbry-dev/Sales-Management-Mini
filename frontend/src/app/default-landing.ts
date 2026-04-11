import { getFirstAccessibleSidebarPath } from "@/app/menu-config";
import { canAccessRoute } from "@/app/route-access";
import type { MeResponse } from "@/types/auth";
import { hasRole, isFrontlineCashierNav, isFrontlineWarehouseNav, isSystemLevelUser } from "@/features/auth/access";

/** Trang không có quyền — alias trong router trỏ tới `/app/khong-duoc-truy-cap`. */
export const FORBIDDEN_ROUTE = "/app/forbidden";

/**
 * Trang mặc định sau đăng nhập / làm mới phiên — chỉ dựa trên `me` từ `/api/auth/me` và ma trận quyền.
 * Ưu tiên các đường dẫn alias (dashboard, orders, inventory, …); nếu không đủ quyền thì fallback sidebar rồi trang cấm.
 */
export function resolveDefaultLandingPath(me: MeResponse): string {
  if (isFrontlineCashierNav(me)) {
    if (canAccessRoute(me, "/app/orders/new")) return "/app/orders/new";
    if (canAccessRoute(me, "/app/orders")) return "/app/orders";
    const sb = getFirstAccessibleSidebarPath(me);
    if (sb) return sb;
    return FORBIDDEN_ROUTE;
  }

  if (isFrontlineWarehouseNav(me)) {
    if (canAccessRoute(me, "/app/inventory")) return "/app/inventory";
    if (canAccessRoute(me, "/app/goods-receipts")) return "/app/goods-receipts";
    if (canAccessRoute(me, "/app/transfers")) return "/app/transfers";
    if (canAccessRoute(me, "/app/stocktakes")) return "/app/stocktakes";
    const sb = getFirstAccessibleSidebarPath(me);
    if (sb) return sb;
    return FORBIDDEN_ROUTE;
  }

  if (isSystemLevelUser(me) || hasRole(me, "STORE_MANAGER") || hasRole(me, "BRANCH_MANAGER")) {
    if (canAccessRoute(me, "/app/dashboard")) return "/app/dashboard";
    const sb = getFirstAccessibleSidebarPath(me);
    if (sb) return sb;
    return FORBIDDEN_ROUTE;
  }

  const sb = getFirstAccessibleSidebarPath(me);
  return sb ?? FORBIDDEN_ROUTE;
}

/** @alias {@link resolveDefaultLandingPath} — giữ tên cũ cho route guard và form đăng nhập. */
export function getPostLoginRedirectPath(me: MeResponse): string {
  return resolveDefaultLandingPath(me);
}
