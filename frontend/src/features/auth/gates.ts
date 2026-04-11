import type { MeResponse } from "@/types/auth";
import {
  hasAnyPermission,
  hasMasterRead,
  hasPermission,
  hasRole,
  isSystemManage,
} from "@/features/auth/access";

/** Hàm kiểm tra quyền từ dữ liệu `/api/auth/me` (không hiển thị mã ra giao diện). */
export type AccessGate = (me: MeResponse) => boolean;

export const allowAll: AccessGate = () => true;

export const gateSystemManage: AccessGate = (me) => isSystemManage(me);

export const gateDashboard: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "DASHBOARD_VIEW");

export const gateStoreView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "STORE_VIEW");

export const gateProductView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "PRODUCT_VIEW");

export const gateProductCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "PRODUCT_CREATE");

export const gateInventoryView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "INVENTORY_VIEW");

export const gateGoodsReceiptView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "GOODS_RECEIPT_VIEW");

export const gateGoodsReceiptCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "GOODS_RECEIPT_CREATE");

export const gateGoodsReceiptConfirm: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "GOODS_RECEIPT_CONFIRM");

export const gateOrderView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "ORDER_VIEW");

export const gateOrderCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "ORDER_CREATE");

export const gateOrderConfirm: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "ORDER_CONFIRM");

export const gateOrderCancel: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "ORDER_CANCEL");

export const gateReturnView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "RETURN_VIEW");

export const gateReturnCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "RETURN_CREATE");

export const gateTransferView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "TRANSFER_VIEW");

export const gateTransferCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "TRANSFER_CREATE");

export const gateTransferSend: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "TRANSFER_SEND");

export const gateTransferReceive: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "TRANSFER_RECEIVE");

export const gateStocktakeView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "STOCKTAKE_VIEW");

export const gateStocktakeCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "STOCKTAKE_CREATE");

export const gateCustomerView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "CUSTOMER_VIEW");

export const gateCustomerCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "CUSTOMER_CREATE");

export const gateCustomerUpdate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "CUSTOMER_UPDATE");

export const gateReportView: AccessGate = (me) =>
  isSystemManage(me) || hasAnyPermission(me, ["REPORT_VIEW", "REPORT_VIEW_BRANCH"]);

export const gateMasterCatalog: AccessGate = (me) => isSystemManage(me) || hasMasterRead(me);

export const gateRbacArea: AccessGate = (me) =>
  isSystemManage(me) ||
  hasAnyPermission(me, ["RBAC_MANAGE", "ROLE_VIEW", "PERMISSION_VIEW", "PERMISSION_OVERRIDE_MANAGE"]);

/** Danh sách người dùng trong một cửa hàng — `GET /api/stores/{storeId}/users`. */
export const gateStoreScopedUserView: AccessGate = (me) =>
  isSystemManage(me) || hasPermission(me, "USER_VIEW");

/** Gán chi nhánh trong phạm vi cửa hàng — `PUT .../users/{userId}/branches`. */
export const gateStoreScopedUserAssignBranch: AccessGate = (me) =>
  isSystemManage(me) || hasPermission(me, "USER_ASSIGN_BRANCH");

export const gateRbacRolesView: AccessGate = (me) =>
  isSystemManage(me) || hasAnyPermission(me, ["ROLE_VIEW", "RBAC_MANAGE"]);

export const gateRbacPermissionsView: AccessGate = (me) =>
  isSystemManage(me) || hasAnyPermission(me, ["PERMISSION_VIEW", "RBAC_MANAGE"]);

export const gateRbacOverridesManage: AccessGate = (me) =>
  isSystemManage(me) || hasPermission(me, "PERMISSION_OVERRIDE_MANAGE");

/**
 * Khớp `@PreAuthorize` trên `StoreStaffUserController` (quản trị hệ thống hoặc vai trò quản lý cửa hàng).
 * Vai trò lấy từ `me.roles` theo backend.
 */
export const gateStoreStaffArea: AccessGate = (me) => isSystemManage(me) || hasRole(me, "STORE_MANAGER");

export const gateSettingsArea: AccessGate = (me) => isSystemManage(me);

/** Danh sách / chi tiết cửa hàng — khớp `@authz.masterRead` trên `GET /api/stores`. */
export const gateStoreDataRead: AccessGate = (me) => isSystemManage(me) || hasMasterRead(me);

export const gateStoreCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "STORE_CREATE");

export const gateStoreUpdate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "STORE_UPDATE");

export const gateBranchView: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "BRANCH_VIEW");

export const gateBranchCreate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "BRANCH_CREATE");

export const gateBranchUpdate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "BRANCH_UPDATE");

/** Tạo / sửa thương hiệu, nhóm hàng, đơn vị — khớp `PRODUCT_UPDATE` trên master data. */
export const gateProductCatalogMutate: AccessGate = (me) => isSystemManage(me) || hasPermission(me, "PRODUCT_UPDATE");

/** Tạo / sửa nhà cung cấp — khớp `GOODS_RECEIPT_CREATE` hoặc `PRODUCT_UPDATE`. */
export const gateSupplierMutate: AccessGate = (me) =>
  isSystemManage(me) || hasAnyPermission(me, ["GOODS_RECEIPT_CREATE", "PRODUCT_UPDATE"]);
