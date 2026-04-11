import type { MeResponse } from "@/types/auth";
import type { AccessGate } from "@/features/auth/gates";
import {
  allowAll,
  gateBranchHubNavigationPage,
  gateBranchPagesWithinStore,
  gateCustomerView,
  gateDashboard,
  gateGoodsReceiptCreate,
  gateGoodsReceiptView,
  gateInventoryTransactionView,
  gateInventoryView,
  gateMasterCatalogManagementPages,
  gateOrderCreate,
  gateOrderView,
  gateProductCreate,
  gateProductView,
  gateRbacAreaRoute,
  gateReportView,
  gateReturnCreate,
  gateReturnView,
  gateSettingsArea,
  gateStocktakeCreate,
  gateStocktakeView,
  gateStoreScopedUserView,
  gateStoreScopedUsersInStorePage,
  gateStoreStaffArea,
  gateStoreTreePages,
  gateSystemManage,
  gateTransferCreate,
  gateTransferView,
  gateWarehouseHubNavigationPage,
  gateWarehousePagesWithinStore,
} from "@/features/auth/gates";

type RouteRule = { match: (path: string) => boolean; gate: AccessGate };

function norm(p: string): string {
  const x = p.split("?")[0] ?? p;
  if (x.length > 1 && x.endsWith("/")) return x.slice(0, -1);
  return x || "/";
}

/**
 * Thứ tự: khớp cụ thể trước — dùng cho `canAccessRoute` và kiểm thử.
 * Khớp `routes/index.tsx` + ROLE_UI_MATRIX.
 */
const ROUTE_RULES: RouteRule[] = [
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/nguoi-dung\/?$/.test(p), gate: gateStoreScopedUsersInStorePage },
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/chi-nhanh\/[^/]+\/?$/.test(p), gate: gateBranchPagesWithinStore },
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/chi-nhanh\/?$/.test(p), gate: gateBranchPagesWithinStore },
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/kho\/[^/]+\/?$/.test(p), gate: gateWarehousePagesWithinStore },
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/kho\/?$/.test(p), gate: gateWarehousePagesWithinStore },
  { match: (p) => /^\/app\/cua-hang\/[^/]+\/?$/.test(p), gate: gateStoreTreePages },
  { match: (p) => p === "/app/cua-hang", gate: gateStoreTreePages },
  { match: (p) => p === "/app/chi-nhanh", gate: gateBranchHubNavigationPage },
  { match: (p) => p === "/app/kho", gate: gateWarehouseHubNavigationPage },
  { match: (p) => /^\/app\/thuong-hieu\/[^/]+\/?$/.test(p), gate: gateMasterCatalogManagementPages },
  { match: (p) => p === "/app/thuong-hieu", gate: gateMasterCatalogManagementPages },
  { match: (p) => /^\/app\/nhom-hang\/[^/]+\/?$/.test(p), gate: gateMasterCatalogManagementPages },
  { match: (p) => p === "/app/nhom-hang", gate: gateMasterCatalogManagementPages },
  { match: (p) => /^\/app\/don-vi\/[^/]+\/?$/.test(p), gate: gateMasterCatalogManagementPages },
  { match: (p) => p === "/app/don-vi", gate: gateMasterCatalogManagementPages },
  { match: (p) => /^\/app\/nha-cung-cap\/[^/]+\/?$/.test(p), gate: gateMasterCatalogManagementPages },
  { match: (p) => p === "/app/nha-cung-cap", gate: gateMasterCatalogManagementPages },
  { match: (p) => p === "/app/san-pham/moi", gate: gateProductCreate },
  { match: (p) => /^\/app\/san-pham\/[^/]+\/?$/.test(p), gate: gateProductView },
  { match: (p) => p === "/app/san-pham", gate: gateProductView },
  { match: (p) => /^\/app\/khach-hang\/[^/]+\/?$/.test(p), gate: gateCustomerView },
  { match: (p) => p === "/app/khach-hang", gate: gateCustomerView },
  { match: (p) => p === "/app/bien-dong-kho", gate: gateInventoryTransactionView },
  { match: (p) => p === "/app/ton-kho", gate: gateInventoryView },
  { match: (p) => p === "/app/phieu-nhap/moi", gate: gateGoodsReceiptCreate },
  { match: (p) => /^\/app\/phieu-nhap\/[^/]+\/?$/.test(p), gate: gateGoodsReceiptView },
  { match: (p) => p === "/app/phieu-nhap", gate: gateGoodsReceiptView },
  { match: (p) => p === "/app/don-ban/moi", gate: gateOrderCreate },
  { match: (p) => /^\/app\/don-ban\/[^/]+\/?$/.test(p), gate: gateOrderView },
  { match: (p) => p === "/app/don-ban", gate: gateOrderView },
  { match: (p) => p === "/app/tra-hang/moi" || p === "/app/returns/moi", gate: gateReturnCreate },
  { match: (p) => /^\/app\/tra-hang\/[^/]+\/?$/.test(p) || /^\/app\/returns\/[^/]+\/?$/.test(p), gate: gateReturnView },
  { match: (p) => p === "/app/tra-hang" || p === "/app/returns", gate: gateReturnView },
  { match: (p) => p === "/app/chuyen-kho/moi", gate: gateTransferCreate },
  { match: (p) => /^\/app\/chuyen-kho\/[^/]+\/?$/.test(p), gate: gateTransferView },
  { match: (p) => p === "/app/chuyen-kho", gate: gateTransferView },
  { match: (p) => p === "/app/kiem-kho/moi", gate: gateStocktakeCreate },
  { match: (p) => /^\/app\/kiem-kho\/[^/]+\/?$/.test(p), gate: gateStocktakeView },
  { match: (p) => p === "/app/kiem-kho", gate: gateStocktakeView },
  { match: (p) => p === "/app/bao-cao", gate: gateReportView },
  { match: (p) => p === "/app/nguoi-dung-cua-hang", gate: gateStoreScopedUserView },
  { match: (p) => p === "/app/nguoi-dung/moi", gate: gateSystemManage },
  { match: (p) => /^\/app\/nguoi-dung\/[^/]+\/?$/.test(p), gate: gateSystemManage },
  { match: (p) => p === "/app/nguoi-dung", gate: gateSystemManage },
  { match: (p) => p === "/app/phan-quyen", gate: gateRbacAreaRoute },
  { match: (p) => p === "/app/nhan-vien-cua-hang/moi", gate: gateStoreStaffArea },
  { match: (p) => /^\/app\/nhan-vien-cua-hang\/[^/]+\/?$/.test(p), gate: gateStoreStaffArea },
  { match: (p) => p === "/app/nhan-vien-cua-hang", gate: gateStoreStaffArea },
  { match: (p) => p === "/app/cai-dat", gate: gateSettingsArea },
  { match: (p) => p === "/app/tong-quan", gate: gateDashboard },
  { match: (p) => p === "/app/dashboard", gate: gateDashboard },
  { match: (p) => p === "/app/orders/new", gate: gateOrderCreate },
  { match: (p) => p === "/app/orders", gate: gateOrderView },
  { match: (p) => p === "/app/inventory", gate: gateInventoryView },
  { match: (p) => p === "/app/goods-receipts", gate: gateGoodsReceiptView },
  { match: (p) => p === "/app/transfers", gate: gateTransferView },
  { match: (p) => p === "/app/stocktakes", gate: gateStocktakeView },
  { match: (p) => p === "/app/forbidden" || p === "/app/khong-duoc-truy-cap", gate: allowAll },
];

export function getRouteAccessGate(pathname: string): AccessGate | undefined {
  const p = norm(pathname);
  for (const r of ROUTE_RULES) {
    if (r.match(p)) return r.gate;
  }
  return undefined;
}

/** `true` nếu không có rule (ví dụ trang lỗi) hoặc gate cho phép. */
export function canAccessRoute(me: MeResponse | null, pathname: string): boolean {
  if (!me) return false;
  const gate = getRouteAccessGate(pathname);
  if (!gate) return true;
  return gate(me);
}
