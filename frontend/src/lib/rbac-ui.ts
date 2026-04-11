/**
 * Lối vào tập trung cho kiểm tra quyền giao diện (menu, route, nút).
 * Chi tiết ma trận: ROLE_UI_MATRIX.md
 */

export {
  hasAnyPermission,
  hasBranchScope,
  hasMasterRead,
  hasPermission,
  hasRole,
  hasStoreScope,
  isSystemLevelUser,
} from "@/lib/access-control";

export { canSeeMenu, type NavMenuKey } from "@/app/menu-config";
export { canAccessRoute, getRouteAccessGate } from "@/app/route-access";

export {
  canSeeCustomerCreate,
  canSeeCustomerUpdate,
  canSeeGoodsReceiptConfirm,
  canSeeGoodsReceiptCreate,
  canSeeProductCreate,
  canSeeReturnConfirm,
  canSeeReturnCreate,
  canSeeSalesOrderCancel,
  canSeeSalesOrderConfirm,
  canSeeSalesOrderCreate,
  canSeeStocktakeConfirm,
  canSeeStocktakeCreate,
  canSeeTransferCreate,
  canSeeTransferReceive,
  canSeeTransferSend,
} from "@/features/auth/action-access";
