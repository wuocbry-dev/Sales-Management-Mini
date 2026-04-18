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
  ShoppingCart,
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
  gateBranchHubNavigationPage,
  gateCustomerView,
  gateDashboard,
  gateGoodsReceiptView,
  gateInventoryView,
  gateMasterCatalogManagementPages,
  gateOrderCreate,
  gateOrderView,
  gateProductView,
  gateRbacAreaRoute,
  gateReportView,
  gateReturnView,
  gateSettingsArea,
  gateStocktakeView,
  gateStoreDataRead,
  gateStoreScopedUserView,
  gateStoreStaffArea,
  gateSystemManage,
  gateTransferView,
  gateWarehouseHubNavigationPage,
} from "@/features/auth/gates";
import {
  isBranchManagerRole,
  isFrontlineCashierNav,
  isFrontlineWarehouseNav,
  isStoreManagerRole,
  isSystemLevelUser,
} from "@/features/auth/access";

/** Khóa mục menu — một nguồn cho ma trận ROLE_UI_MATRIX. */
export type NavMenuKey =
  | "tong-quan"
  | "ban-hang"
  | "cua-hang"
  | "san-pham"
  | "ton-kho"
  | "phieu-nhap"
  | "don-ban"
  | "tra-hang"
  | "chuyen-kho"
  | "kiem-kho"
  | "khach-hang"
  | "bao-cao"
  | "chi-nhanh"
  | "kho"
  | "thuong-hieu"
  | "nhom-hang"
  | "don-vi"
  | "nha-cung-cap"
  | "nguoi-dung-cua-hang"
  | "nguoi-dung"
  | "phan-quyen"
  | "nhan-vien-cua-hang"
  | "cai-dat";

export type AppNavItem = {
  key: NavMenuKey;
  label: string;
  to: string;
  icon: LucideIcon;
  access: AccessGate;
};

type NavSectionKey = "main" | "master" | "admin" | "footer";

type MenuDef = {
  key: NavMenuKey;
  section: NavSectionKey;
  order: number;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Quyền tối thiểu để vào route (khớp backend). */
  access: AccessGate;
  /**
   * Sau khi `access` đạt — `false` ẩn khỏi sidebar theo ROLE_UI_MATRIX
   * (không mở menu quản trị cấp cao chỉ vì đọc danh mục gián tiếp).
   */
  sidebarVisible?: (me: MeResponse) => boolean;
};

const MENU_DEFS: MenuDef[] = [
  {
    key: "tong-quan",
    section: "main",
    order: 10,
    label: "Tổng quan",
    to: "/app/tong-quan",
    icon: LayoutDashboard,
    access: gateDashboard,
    sidebarVisible: (me) => !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "ban-hang",
    section: "main",
    order: 15,
    label: "Bán hàng",
    to: "/app/pos",
    icon: ShoppingCart,
    access: gateOrderCreate,
    sidebarVisible: (me) =>
      isFrontlineCashierNav(me) ||
      (isBranchManagerRole(me) && gateOrderCreate(me)) ||
      (isStoreManagerRole(me) && gateOrderCreate(me)),
  },
  {
    key: "cua-hang",
    section: "main",
    order: 20,
    label: "Cửa hàng",
    to: "/app/cua-hang",
    icon: Store,
    access: gateStoreDataRead,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "san-pham",
    section: "main",
    order: 30,
    label: "Sản phẩm",
    to: "/app/san-pham",
    icon: Package,
    access: gateProductView,
  },
  {
    key: "ton-kho",
    section: "main",
    order: 40,
    label: "Tồn kho",
    to: "/app/ton-kho",
    icon: Warehouse,
    access: gateInventoryView,
  },
  {
    key: "phieu-nhap",
    section: "main",
    order: 50,
    label: "Phiếu nhập",
    to: "/app/phieu-nhap",
    icon: Truck,
    access: gateGoodsReceiptView,
    sidebarVisible: (me) => !isFrontlineCashierNav(me),
  },
  {
    key: "don-ban",
    section: "main",
    order: 60,
    label: "Đơn bán",
    to: "/app/don-ban",
    icon: Receipt,
    access: gateOrderView,
    sidebarVisible: (me) => !isFrontlineWarehouseNav(me),
  },
  {
    key: "tra-hang",
    section: "main",
    order: 70,
    label: "Trả hàng",
    to: "/app/tra-hang",
    icon: RotateCcw,
    access: gateReturnView,
    sidebarVisible: (me) => !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "chuyen-kho",
    section: "main",
    order: 80,
    label: "Chuyển kho",
    to: "/app/chuyen-kho",
    icon: Boxes,
    access: gateTransferView,
    sidebarVisible: (me) => !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "kiem-kho",
    section: "main",
    order: 90,
    label: "Kiểm kho",
    to: "/app/kiem-kho",
    icon: ClipboardList,
    access: gateStocktakeView,
    sidebarVisible: (me) => !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "khach-hang",
    section: "main",
    order: 100,
    label: "Khách hàng",
    to: "/app/khach-hang",
    icon: Users,
    access: gateCustomerView,
    sidebarVisible: (me) => !isFrontlineWarehouseNav(me),
  },
  {
    key: "bao-cao",
    section: "main",
    order: 110,
    label: "Báo cáo",
    to: "/app/bao-cao",
    icon: BarChart3,
    access: gateReportView,
    sidebarVisible: (me) => !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "chi-nhanh",
    section: "master",
    order: 20,
    label: "Chi nhánh",
    to: "/app/chi-nhanh",
    icon: Building2,
    access: gateBranchHubNavigationPage,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "kho",
    section: "master",
    order: 30,
    label: "Kho hàng",
    to: "/app/kho",
    icon: Archive,
    access: gateWarehouseHubNavigationPage,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "thuong-hieu",
    section: "master",
    order: 40,
    label: "Thương hiệu",
    to: "/app/thuong-hieu",
    icon: Tag,
    access: gateMasterCatalogManagementPages,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "nhom-hang",
    section: "master",
    order: 50,
    label: "Nhóm hàng",
    to: "/app/nhom-hang",
    icon: FolderTree,
    access: gateMasterCatalogManagementPages,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "don-vi",
    section: "master",
    order: 60,
    label: "Đơn vị tính",
    to: "/app/don-vi",
    icon: Ruler,
    access: gateMasterCatalogManagementPages,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "nha-cung-cap",
    section: "master",
    order: 70,
    label: "Nhà cung cấp",
    to: "/app/nha-cung-cap",
    icon: Handshake,
    access: gateMasterCatalogManagementPages,
    sidebarVisible: (me) =>
      !isBranchManagerRole(me) && !isFrontlineCashierNav(me) && !isFrontlineWarehouseNav(me),
  },
  {
    key: "nguoi-dung-cua-hang",
    section: "admin",
    order: 10,
    label: "Người dùng cửa hàng",
    to: "/app/nguoi-dung-cua-hang",
    icon: Users,
    access: gateStoreScopedUserView,
    sidebarVisible: (me) =>
      gateStoreScopedUserView(me) &&
      (isSystemLevelUser(me) || (me.storeIds?.length ?? 0) > 0) &&
      !isFrontlineCashierNav(me) &&
      !isFrontlineWarehouseNav(me),
  },
  {
    key: "nguoi-dung",
    section: "admin",
    order: 20,
    label: "Người dùng hệ thống",
    to: "/app/nguoi-dung",
    icon: UserCog,
    access: gateSystemManage,
  },
  {
    key: "phan-quyen",
    section: "admin",
    order: 30,
    label: "Phân quyền",
    to: "/app/phan-quyen",
    icon: Shield,
    access: gateRbacAreaRoute,
  },
  {
    key: "nhan-vien-cua-hang",
    section: "admin",
    order: 40,
    label: "Nhân viên cửa hàng",
    to: "/app/nhan-vien-cua-hang",
    icon: Users,
    access: gateStoreStaffArea,
    sidebarVisible: (me) => !isBranchManagerRole(me),
  },
  {
    key: "cai-dat",
    section: "footer",
    order: 10,
    label: "Cài đặt",
    to: "/app/cai-dat",
    icon: Settings2,
    access: gateSettingsArea,
  },
];

const MENU_BY_KEY = new Map<NavMenuKey, MenuDef>(MENU_DEFS.map((d) => [d.key, d]));

function isVisibleInSidebar(me: MeResponse, def: MenuDef): boolean {
  if (!def.access(me)) return false;
  if (def.sidebarVisible) return def.sidebarVisible(me);
  return true;
}

function toNavItem(def: MenuDef): AppNavItem {
  return { key: def.key, label: def.label, to: def.to, icon: def.icon, access: def.access };
}

const SECTION_TITLES: Record<NavSectionKey, string> = {
  main: "Nghiệp vụ",
  master: "Danh mục",
  admin: "Quản trị",
  footer: "Khác",
};

/** Hiển thị mục menu trên sidebar theo ma trận vai trò. */
export function canSeeMenu(me: MeResponse | null, key: NavMenuKey): boolean {
  if (!me) return false;
  const def = MENU_BY_KEY.get(key);
  if (!def) return false;
  return isVisibleInSidebar(me, def);
}

export function getSidebarSections(me: MeResponse): { title: string; items: AppNavItem[] }[] {
  const keys: NavSectionKey[] = ["main", "master", "admin", "footer"];
  return keys
    .map((key) => {
      const items = MENU_DEFS.filter((d) => d.section === key)
        .filter((d) => isVisibleInSidebar(me, d))
        .sort((a, b) => a.order - b.order)
        .map(toNavItem);
      return { title: SECTION_TITLES[key], items };
    })
    .filter((s) => s.items.length > 0);
}

export function getSidebarFlatItems(me: MeResponse): AppNavItem[] {
  return getSidebarSections(me).flatMap((s) => s.items);
}

export function getFirstAccessibleSidebarPath(me: MeResponse): string | null {
  for (const item of getSidebarFlatItems(me)) {
    if (item.access(me)) return item.to;
  }
  return null;
}

export const NAV_ACCESS_BY_PATH: ReadonlyMap<string, AccessGate> = new Map(
  MENU_DEFS.map((d) => [d.to, d.access]),
);

export function getNavAccessGate(pathname: string): AccessGate | undefined {
  return NAV_ACCESS_BY_PATH.get(pathname);
}

export const NAV_MENU_DEFINITIONS: ReadonlyArray<Readonly<MenuDef>> = MENU_DEFS;
