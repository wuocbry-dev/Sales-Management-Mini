import type { ReactNode } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import { AppShellLayout } from "@/layouts/app-shell-layout";
import { PublicLayout } from "@/layouts/public-layout";
import { BranchHubPage } from "@/pages/app/branch-hub-page";
import { ForbiddenPage } from "@/pages/app/forbidden-page";
import { NotFoundPage } from "@/pages/app/not-found-page";
import { SettingsPage } from "@/pages/app/settings-page";
import { TongQuanPage } from "@/pages/app/tong-quan-page";
import { WarehouseHubPage } from "@/pages/app/warehouse-hub-page";
import { LoginPage } from "@/pages/auth/login-page";
import { RegisterPage } from "@/pages/auth/register-page";
import { LandingPage } from "@/pages/public/landing-page";
import {
  type AccessGate,
  gateBranchHubNavigationPage,
  gateCustomerView,
  gateDashboard,
  gateGoodsReceiptCreate,
  gateGoodsReceiptView,
  gateInventoryView,
  gateMasterCatalogManagementPages,
  gateOrderCreate,
  gateOrderView,
  gateProductCatalogMutate,
  gateProductCreate,
  gateProductView,
  gateRbacAreaRoute,
  gateReportView,
  gateReturnCreate,
  gateReturnView,
  gateSettingsArea,
  gateStocktakeCreate,
  gateStocktakeView,
  gateBranchPagesWithinStore,
  gateStoreScopedUserView,
  gateStoreScopedUsersInStorePage,
  gateStoreStaffArea,
  gateStoreTreePages,
  gateWarehousePagesWithinStore,
  gateSystemManage,
  gateTransferCreate,
  gateTransferView,
  gateWarehouseHubNavigationPage,
} from "@/features/auth/gates";
import { BranchDetailPage } from "@/features/branches/branch-detail-page";
import { BranchListPage } from "@/features/branches/branch-list-page";
import { BrandDetailPage } from "@/features/brands/brand-detail-page";
import { BrandListPage } from "@/features/brands/brand-list-page";
import { CategoryDetailPage } from "@/features/categories/category-detail-page";
import { CategoryListPage } from "@/features/categories/category-list-page";
import { CustomerDetailPage } from "@/features/customers/customer-detail-page";
import { CustomerListPage } from "@/features/customers/customer-list-page";
import { GoodsReceiptCreatePage } from "@/features/goods-receipts/goods-receipt-create-page";
import { GoodsReceiptDetailPage } from "@/features/goods-receipts/goods-receipt-detail-page";
import { GoodsReceiptListPage } from "@/features/goods-receipts/goods-receipt-list-page";
import { InventoryOverviewPage } from "@/features/inventory/inventory-overview-page";
import { ProductCreatePage } from "@/features/products/product-create-page";
import { ProductDetailPage } from "@/features/products/product-detail-page";
import { ProductEditPage } from "@/features/products/product-edit-page";
import { ProductListPage } from "@/features/products/product-list-page";
import { PosTerminalPage } from "@/features/pos/pos-terminal-page";
import { RbacHubPage } from "@/features/rbac/rbac-hub-page";
import { ReportSummaryPage } from "@/features/reports/report-summary-page";
import { SalesOrderDetailPage } from "@/features/sales-orders/sales-order-detail-page";
import { SalesOrderListPage } from "@/features/sales-orders/sales-order-list-page";
import { SalesReturnCreatePage } from "@/features/sales-returns/sales-return-create-page";
import { SalesReturnDetailPage } from "@/features/sales-returns/sales-return-detail-page";
import { SalesReturnListPage } from "@/features/sales-returns/sales-return-list-page";
import { StockTransferCreatePage } from "@/features/stock-transfers/stock-transfer-create-page";
import { StockTransferDetailPage } from "@/features/stock-transfers/stock-transfer-detail-page";
import { StockTransferListPage } from "@/features/stock-transfers/stock-transfer-list-page";
import { StocktakeCreatePage } from "@/features/stocktakes/stocktake-create-page";
import { StocktakeDetailPage } from "@/features/stocktakes/stocktake-detail-page";
import { StocktakeListPage } from "@/features/stocktakes/stocktake-list-page";
import { StoreDetailPage } from "@/features/stores/store-detail-page";
import { StoreListPage } from "@/features/stores/store-list-page";
import { StoreStaffCreatePage } from "@/features/store-staff/store-staff-create-page";
import { StoreStaffDetailPage } from "@/features/store-staff/store-staff-detail-page";
import { StoreStaffListPage } from "@/features/store-staff/store-staff-list-page";
import { SupplierDetailPage } from "@/features/suppliers/supplier-detail-page";
import { SupplierListPage } from "@/features/suppliers/supplier-list-page";
import { UnitDetailPage } from "@/features/units/unit-detail-page";
import { UnitListPage } from "@/features/units/unit-list-page";
import { WarehouseDetailPage } from "@/features/warehouses/warehouse-detail-page";
import { StoreScopedUsersHubPage } from "@/features/users/store-scoped-users-hub-page";
import { StoreScopedUsersPage } from "@/features/users/store-scoped-users-page";
import { SystemUserCreatePage } from "@/features/users/system-user-create-page";
import { SystemUserDetailPage } from "@/features/users/system-user-detail-page";
import { SystemUserListPage } from "@/features/users/system-user-list-page";
import { WarehouseListPage } from "@/features/warehouses/warehouse-list-page";
import { AppIndexRedirect } from "@/routes/app-index-redirect";
import type { AppRouteHandle } from "@/routes/app-route-handles";
import { PermissionRoute } from "@/routes/permission-route";
import { ProtectedRoute } from "@/routes/protected-route";

function guarded(path: string, node: ReactNode, handle: AppRouteHandle, requireAccess: AccessGate): RouteObject {
  return {
    path,
    element: <PermissionRoute>{node}</PermissionRoute>,
    handle: { ...handle, requireAccess } satisfies AppRouteHandle,
  };
}

const appChildren: RouteObject[] = [
  { index: true, element: <AppIndexRedirect /> },
  { path: "dashboard", element: <Navigate to="/app/tong-quan" replace /> },
  { path: "stores", element: <Navigate to="/app/cua-hang" replace /> },
  { path: "branches", element: <Navigate to="/app/chi-nhanh" replace /> },
  { path: "warehouses", element: <Navigate to="/app/kho" replace /> },
  { path: "brands", element: <Navigate to="/app/thuong-hieu" replace /> },
  { path: "categories", element: <Navigate to="/app/nhom-hang" replace /> },
  { path: "units", element: <Navigate to="/app/don-vi" replace /> },
  { path: "suppliers", element: <Navigate to="/app/nha-cung-cap" replace /> },
  { path: "products/new", element: <Navigate to="/app/san-pham/moi" replace /> },
  { path: "products", element: <Navigate to="/app/san-pham" replace /> },
  { path: "customers", element: <Navigate to="/app/khach-hang" replace /> },
  { path: "orders/new", element: <Navigate to="/app/don-ban/moi" replace /> },
  { path: "orders", element: <Navigate to="/app/don-ban" replace /> },
  { path: "inventory", element: <Navigate to="/app/ton-kho" replace /> },
  { path: "goods-receipts", element: <Navigate to="/app/phieu-nhap" replace /> },
  { path: "returns", element: <Navigate to="/app/tra-hang" replace /> },
  { path: "transfers", element: <Navigate to="/app/chuyen-kho" replace /> },
  { path: "stocktakes", element: <Navigate to="/app/kiem-kho" replace /> },
  { path: "users", element: <Navigate to="/app/nguoi-dung" replace /> },
  { path: "store-users", element: <Navigate to="/app/nguoi-dung-cua-hang" replace /> },
  { path: "store-staff", element: <Navigate to="/app/nhan-vien-cua-hang" replace /> },
  { path: "reports", element: <Navigate to="/app/bao-cao" replace /> },
  { path: "rbac", element: <Navigate to="/app/phan-quyen" replace /> },
  { path: "forbidden", element: <Navigate to="/app/khong-duoc-truy-cap" replace /> },
  {
    path: "khong-duoc-truy-cap",
    element: <ForbiddenPage />,
    handle: { title: "Không được phép" } satisfies AppRouteHandle,
  },
  {
    path: "khong-tim-thay",
    element: <NotFoundPage />,
    handle: { title: "Không tìm thấy trang" } satisfies AppRouteHandle,
  },
  guarded(
    "tong-quan",
    <TongQuanPage />,
    {
      title: "Tổng quan",
      subtitle: "Chỉ số kinh doanh và vận hành theo phạm vi bạn được phép xem.",
    },
    gateDashboard,
  ),
  guarded("cua-hang", <StoreListPage />, { title: "Cửa hàng", subtitle: "Danh sách cửa hàng được phân quyền xem." }, gateStoreTreePages),
  guarded("cua-hang/:storeId", <StoreDetailPage />, { title: "Chi tiết cửa hàng" }, gateStoreTreePages),
  guarded(
    "cua-hang/:storeId/nguoi-dung",
    <StoreScopedUsersPage />,
    { title: "Người dùng trong cửa hàng" },
    gateStoreScopedUsersInStorePage,
  ),
  guarded(
    "cua-hang/:storeId/chi-nhanh/:branchId",
    <BranchDetailPage />,
    { title: "Chi tiết chi nhánh" },
    gateBranchPagesWithinStore,
  ),
  guarded("cua-hang/:storeId/chi-nhanh", <BranchListPage />, { title: "Chi nhánh" }, gateBranchPagesWithinStore),
  guarded(
    "cua-hang/:storeId/kho/:warehouseId",
    <WarehouseDetailPage />,
    { title: "Chi tiết kho" },
    gateWarehousePagesWithinStore,
  ),
  guarded("cua-hang/:storeId/kho", <WarehouseListPage />, { title: "Kho hàng" }, gateWarehousePagesWithinStore),
  guarded("chi-nhanh", <BranchHubPage />, { title: "Chi nhánh", subtitle: "Điều hướng tới cửa hàng để quản lý chi nhánh." }, gateBranchHubNavigationPage),
  guarded("kho", <WarehouseHubPage />, { title: "Kho hàng", subtitle: "Điều hướng tới cửa hàng để xem kho." }, gateWarehouseHubNavigationPage),
  guarded("thuong-hieu", <BrandListPage />, { title: "Thương hiệu", subtitle: "Danh mục thương hiệu hàng hóa." }, gateMasterCatalogManagementPages),
  guarded("thuong-hieu/:id", <BrandDetailPage />, { title: "Chi tiết thương hiệu" }, gateMasterCatalogManagementPages),
  guarded("nhom-hang", <CategoryListPage />, { title: "Nhóm hàng", subtitle: "Danh mục nhóm hàng." }, gateMasterCatalogManagementPages),
  guarded("nhom-hang/:id", <CategoryDetailPage />, { title: "Chi tiết nhóm hàng" }, gateMasterCatalogManagementPages),
  guarded("don-vi", <UnitListPage />, { title: "Đơn vị tính", subtitle: "Đơn vị quy đổi hàng hóa." }, gateMasterCatalogManagementPages),
  guarded("don-vi/:id", <UnitDetailPage />, { title: "Chi tiết đơn vị tính" }, gateMasterCatalogManagementPages),
  guarded("nha-cung-cap", <SupplierListPage />, { title: "Nhà cung cấp", subtitle: "Đối tác cung ứng." }, gateMasterCatalogManagementPages),
  guarded("nha-cung-cap/:id", <SupplierDetailPage />, { title: "Chi tiết nhà cung cấp" }, gateMasterCatalogManagementPages),
  guarded("san-pham/moi", <ProductCreatePage />, { title: "Thêm sản phẩm" }, gateProductCreate),
  guarded(
    "san-pham/:id/sua",
    <ProductEditPage />,
    { title: "Sửa sản phẩm" },
    gateProductCatalogMutate,
  ),
  guarded("san-pham/:id", <ProductDetailPage />, { title: "Chi tiết sản phẩm" }, gateProductView),
  guarded("san-pham", <ProductListPage />, { title: "Sản phẩm", subtitle: "Danh mục hàng hóa theo phạm vi cửa hàng." }, gateProductView),
  guarded("khach-hang/:id", <CustomerDetailPage />, { title: "Chi tiết khách hàng" }, gateCustomerView),
  guarded("khach-hang", <CustomerListPage />, { title: "Khách hàng", subtitle: "Danh sách khách hàng." }, gateCustomerView),
  guarded("ton-kho", <InventoryOverviewPage />, { title: "Tồn kho", subtitle: "Tồn theo kho, theo cửa hàng và biến động." }, gateInventoryView),
  guarded("phieu-nhap/moi", <GoodsReceiptCreatePage />, { title: "Tạo phiếu nhập" }, gateGoodsReceiptCreate),
  guarded("phieu-nhap/:id", <GoodsReceiptDetailPage />, { title: "Chi tiết phiếu nhập" }, gateGoodsReceiptView),
  guarded("phieu-nhap", <GoodsReceiptListPage />, { title: "Phiếu nhập", subtitle: "Nhập hàng vào kho." }, gateGoodsReceiptView),
  { path: "don-ban/moi", element: <Navigate to="/app/pos" replace /> },
  guarded("pos", <PosTerminalPage />, { title: "" }, gateOrderCreate),
  guarded("don-ban/:id", <SalesOrderDetailPage />, { title: "Chi tiết đơn hàng" }, gateOrderView),
  guarded("don-ban", <SalesOrderListPage />, { title: "Đơn bán", subtitle: "Đơn hàng bán lẻ." }, gateOrderView),
  guarded("tra-hang/moi", <SalesReturnCreatePage />, { title: "Tạo phiếu trả" }, gateReturnCreate),
  guarded("tra-hang/:id", <SalesReturnDetailPage />, { title: "Chi tiết phiếu trả" }, gateReturnView),
  guarded("tra-hang", <SalesReturnListPage />, { title: "Trả hàng", subtitle: "Trả hàng theo đơn đã hoàn tất." }, gateReturnView),
  guarded("chuyen-kho/moi", <StockTransferCreatePage />, { title: "Tạo phiếu chuyển" }, gateTransferCreate),
  guarded("chuyen-kho/:id", <StockTransferDetailPage />, { title: "Chi tiết phiếu chuyển" }, gateTransferView),
  guarded("chuyen-kho", <StockTransferListPage />, { title: "Chuyển kho", subtitle: "Chuyển hàng giữa các kho." }, gateTransferView),
  guarded("kiem-kho/moi", <StocktakeCreatePage />, { title: "Tạo phiếu kiểm" }, gateStocktakeCreate),
  guarded("kiem-kho/:id", <StocktakeDetailPage />, { title: "Chi tiết phiếu kiểm" }, gateStocktakeView),
  guarded("kiem-kho", <StocktakeListPage />, { title: "Kiểm kho", subtitle: "Kiểm kê tồn tại kho." }, gateStocktakeView),
  guarded(
    "bao-cao",
    <ReportSummaryPage />,
    { title: "Báo cáo", subtitle: "Tổng hợp doanh thu và đơn hàng theo phạm vi được phép." },
    gateReportView,
  ),
  guarded(
    "nguoi-dung-cua-hang",
    <StoreScopedUsersHubPage />,
    { title: "Người dùng cửa hàng", subtitle: "Chọn cửa hàng để quản lý người dùng trong phạm vi." },
    gateStoreScopedUserView,
  ),
  guarded("nguoi-dung/moi", <SystemUserCreatePage />, { title: "Thêm người dùng hệ thống" }, gateSystemManage),
  guarded("nguoi-dung/:id", <SystemUserDetailPage />, { title: "Chi tiết người dùng hệ thống" }, gateSystemManage),
  guarded(
    "nguoi-dung",
    <SystemUserListPage />,
    { title: "Người dùng hệ thống", subtitle: "Quản trị tài khoản toàn hệ thống." },
    gateSystemManage,
  ),
  guarded("phan-quyen", <RbacHubPage />, { title: "Phân quyền", subtitle: "Vai trò, quyền và ghi đè." }, gateRbacAreaRoute),
  guarded("nhan-vien-cua-hang/moi", <StoreStaffCreatePage />, { title: "Thêm nhân viên cửa hàng" }, gateStoreStaffArea),
  guarded("nhan-vien-cua-hang/:id", <StoreStaffDetailPage />, { title: "Chi tiết nhân viên" }, gateStoreStaffArea),
  guarded(
    "nhan-vien-cua-hang",
    <StoreStaffListPage />,
    { title: "Nhân viên cửa hàng", subtitle: "Thu ngân và nhân viên kho." },
    gateStoreStaffArea,
  ),
  guarded("cai-dat", <SettingsPage />, { title: "Cài đặt", subtitle: "Thông tin tài khoản của bạn." }, gateSettingsArea),
  {
    path: "*",
    element: <NotFoundPage />,
    handle: { title: "Không tìm thấy trang" } satisfies AppRouteHandle,
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: appChildren,
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
