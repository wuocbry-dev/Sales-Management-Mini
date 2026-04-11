import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FolderTree,
  Handshake,
  LayoutDashboard,
  Package,
  Receipt,
  RotateCcw,
  Ruler,
  Settings2,
  Shield,
  Store,
  Tag,
  Truck,
  Users,
  UserCog,
  Warehouse,
} from "lucide-react";
import type { MeResponse } from "@/types/auth";
import type { AccessGate } from "@/features/auth/gates";
import {
  gateBranchView,
  gateCustomerView,
  gateDashboard,
  gateGoodsReceiptView,
  gateInventoryView,
  gateMasterCatalog,
  gateOrderView,
  gateProductView,
  gateRbacArea,
  gateReportView,
  gateReturnView,
  gateSettingsArea,
  gateStocktakeView,
  gateStoreDataRead,
  gateStoreStaffArea,
  gateSystemManage,
  gateTransferView,
} from "@/features/auth/gates";

export type AppNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  access: AccessGate;
};

export const APP_NAV_MAIN: AppNavItem[] = [
  { label: "Tổng quan", to: "/app/tong-quan", icon: LayoutDashboard, access: gateDashboard },
  { label: "Cửa hàng", to: "/app/cua-hang", icon: Store, access: gateStoreDataRead },
  { label: "Sản phẩm", to: "/app/san-pham", icon: Package, access: gateProductView },
  { label: "Tồn kho", to: "/app/ton-kho", icon: Warehouse, access: gateInventoryView },
  { label: "Phiếu nhập", to: "/app/phieu-nhap", icon: Truck, access: gateGoodsReceiptView },
  { label: "Đơn bán", to: "/app/don-ban", icon: Receipt, access: gateOrderView },
  { label: "Trả hàng", to: "/app/tra-hang", icon: RotateCcw, access: gateReturnView },
  { label: "Chuyển kho", to: "/app/chuyen-kho", icon: Boxes, access: gateTransferView },
  { label: "Kiểm kho", to: "/app/kiem-kho", icon: ClipboardList, access: gateStocktakeView },
  { label: "Khách hàng", to: "/app/khach-hang", icon: Users, access: gateCustomerView },
  { label: "Báo cáo", to: "/app/bao-cao", icon: BarChart3, access: gateReportView },
];

export const APP_NAV_MASTER: AppNavItem[] = [
  { label: "Chi nhánh", to: "/app/chi-nhanh", icon: Building2, access: gateBranchView },
  { label: "Kho hàng", to: "/app/kho", icon: Archive, access: gateInventoryView },
  { label: "Thương hiệu", to: "/app/thuong-hieu", icon: Tag, access: gateMasterCatalog },
  { label: "Nhóm hàng", to: "/app/nhom-hang", icon: FolderTree, access: gateMasterCatalog },
  { label: "Đơn vị tính", to: "/app/don-vi", icon: Ruler, access: gateMasterCatalog },
  { label: "Nhà cung cấp", to: "/app/nha-cung-cap", icon: Handshake, access: gateMasterCatalog },
];

export const APP_NAV_ADMIN: AppNavItem[] = [
  { label: "Người dùng hệ thống", to: "/app/nguoi-dung", icon: UserCog, access: gateSystemManage },
  { label: "Phân quyền", to: "/app/phan-quyen", icon: Shield, access: gateRbacArea },
  { label: "Nhân viên cửa hàng", to: "/app/nhan-vien-cua-hang", icon: Users, access: gateStoreStaffArea },
];

export const APP_NAV_FOOTER: AppNavItem[] = [
  { label: "Cài đặt", to: "/app/cai-dat", icon: Settings2, access: gateSettingsArea },
];

/** Thứ tự duyệt khi chọn trang mặc định sau đăng nhập. */
export const APP_NAV_FLAT: AppNavItem[] = [
  ...APP_NAV_MAIN,
  ...APP_NAV_MASTER,
  ...APP_NAV_ADMIN,
  ...APP_NAV_FOOTER,
];

export const NAV_ACCESS_BY_PATH: ReadonlyMap<string, AccessGate> = new Map(
  APP_NAV_FLAT.map((item) => [item.to, item.access]),
);

export function getNavAccessGate(pathname: string): AccessGate | undefined {
  return NAV_ACCESS_BY_PATH.get(pathname);
}

export function getFirstAccessibleAppPath(me: MeResponse): string | null {
  for (const item of APP_NAV_FLAT) {
    if (item.access(me)) return item.to;
  }
  return null;
}
