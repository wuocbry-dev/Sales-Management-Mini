# Ma trận vai trò → giao diện (ROLE → UI)

Tài liệu này **bám mã nguồn backend và bootstrap quyền**; phần “UX đề xuất” ghi rõ khi menu/route **không** nên là trang quản trị cấp cao dù API đọc (`@authz.masterRead`) vẫn có thể cho phép tra cứu gián tiếp.

## Nguồn sự thật đã đối chiếu

| Nguồn | Vị trí |
|--------|--------|
| Bootstrap quyền theo role | `backend/.../PermissionBootstrapService.java` |
| SpEL `@authz` | `backend/.../AuthorizationExpressions.java` (`systemManage`, `masterRead`, `reportRead`) |
| Bảo mật HTTP | `backend/.../security/SecurityConfig.java` — `/api/auth/login`, `/api/auth/register`, `/api/health` permitAll; còn lại `/api/**` authenticated + `@PreAuthorize` |
| JWT / login / me | `AuthController`, `AuthService`, `AuthDtos` — `AuthResponse` và `MeResponse`: `roles`, `permissions`, `storeIds`, `branchIds` (+ `defaultStoreId` trên me) |
| Legacy admin | `AuthorizationExpressions.systemManage()` = `ROLE_SYSTEM_ADMIN` **hoặc** `ROLE_ADMIN` |
| Postman | `postman/QuanLyBanHang.postman_collection.json` (mô tả auth, store, RBAC…) |
| Mô tả vai trò DB | `Docx/sql/DataBase.sql`, `Docx/sql/11204.sql` (mô tả text role) |
| Route + gate SPA | `frontend/src/routes/index.tsx`, `frontend/src/features/auth/gates.ts`, `frontend/src/app/menu-config.ts`, `frontend/src/app/default-landing.ts`, `frontend/src/routes/permission-route.tsx` |

## Phản hồi API auth (không đoán)

- **`POST /api/auth/login`** → `AuthResponse`: `accessToken`, `tokenType`, `expiresInSeconds`, `user`, `roles`, `permissions`, `storeIds`, `branchIds` (`AuthDtos.AuthResponse`).
- **`GET /api/auth/me`** → `MeResponse`: thêm `defaultStoreId` (`AuthDtos.MeResponse`).

## Phạm vi `storeIds` / `branchIds`

- JWT và `me` mang `storeIds`, `branchIds`; từng service kiểm tra phạm vi (ví dụ sai `storeId` → **403** `FORBIDDEN`, xem `Docx/AUTH_API_TEST.md`).
- `ADMIN` / `SYSTEM_ADMIN`: `systemManage` bỏ qua guard store theo tài liệu test.

## Vòng đời nghiệp vụ (backend)

| Nghiệp vụ | Luồng trạng thái (mức UI/API) |
|-----------|--------------------------------|
| Phiếu nhập (`/api/goods-receipts`) | **DRAFT** (POST tạo) → **CONFIRM** (POST `/{id}/confirm`, quyền `GOODS_RECEIPT_CONFIRM`) |
| Đơn bán (`/api/sales-orders`) | **DRAFT** (POST) → **CONFIRM** (`ORDER_CONFIRM`) / **CANCEL** (`ORDER_CANCEL`) |
| Trả hàng (`/api/sales-returns`) | **DRAFT** (POST, `RETURN_CREATE`) → xác nhận: POST `/{id}/confirm` vẫn **`RETURN_CREATE`** (không dùng `RETURN_CONFIRM` trên controller) |
| Chuyển kho (`/api/stock-transfers`) | **DRAFT** → **SEND** (`TRANSFER_SEND`) → **RECEIVE** (`TRANSFER_RECEIVE`) |
| Kiểm kê (`/api/stocktakes`) | **DRAFT** (POST, `STOCKTAKE_CREATE`) → chốt: POST `/{id}/confirm` vẫn **`STOCKTAKE_CREATE`** (không dùng `STOCKTAKE_CONFIRM` trên controller) |

**Lưu ý bootstrap:** `PermissionBootstrapService` gán `RETURN_CONFIRM`, `STOCKTAKE_CONFIRM` cho một số role nhưng **endpoint xác nhận không kiểm tra** các authority đó — ma trận **nút/API** dùng quyền thực trên controller.

## Ánh xạ route (ứng viên tiếng Anh ↔ SPA thật)

Ứng dụng dùng path tiếng Việt dưới `/app`. Một số alias `Navigate` tồn tại trong `routes/index.tsx`.

| Ứng viên (đặt tên tiếng Anh) | Route SPA chính | Alias (nếu có) |
|------------------------------|-----------------|----------------|
| `/app/dashboard` | `/app/tong-quan` | `dashboard` → `tong-quan` |
| `/app/stores` | `/app/cua-hang` | *(không có alias `stores`)* |
| `/app/branches` | `/app/chi-nhanh` (hub) hoặc `/app/cua-hang/:storeId/chi-nhanh` | |
| `/app/warehouses` | `/app/kho` (hub) hoặc `/app/cua-hang/:storeId/kho` | |
| `/app/brands` | `/app/thuong-hieu` | |
| `/app/categories` | `/app/nhom-hang` | |
| `/app/units` | `/app/don-vi` | |
| `/app/suppliers` | `/app/nha-cung-cap` | |
| `/app/products` | `/app/san-pham` | |
| `/app/products/new` | `/app/san-pham/moi` | |
| `/app/products/:id` | `/app/san-pham/:id` | |
| `/app/customers` | `/app/khach-hang` | |
| `/app/inventory` | `/app/ton-kho` | `inventory` → `ton-kho` |
| `/app/inventory/transactions` | `/app/bien-dong-kho` | *(không alias `inventory/transactions`)* |
| `/app/goods-receipts` | `/app/phieu-nhap` | `goods-receipts` → `phieu-nhap` |
| `/app/goods-receipts/new` | `/app/phieu-nhap/moi` | |
| `/app/goods-receipts/:id` | `/app/phieu-nhap/:id` | |
| `/app/orders` | `/app/don-ban` | `orders` → `don-ban` |
| `/app/orders/new` | `/app/don-ban/moi` | `orders/new` → `don-ban/moi` |
| `/app/orders/:id` | `/app/don-ban/:id` | |
| `/app/returns` | `/app/tra-hang` | *(không alias)* |
| `/app/transfers` | `/app/chuyen-kho` | `transfers` → `chuyen-kho` |
| `/app/stocktakes` | `/app/kiem-kho` | `stocktakes` → `kiem-kho` |
| `/app/users` | `/app/nguoi-dung` | |
| `/app/store-users` | `/app/nguoi-dung-cua-hang` (+ `/app/cua-hang/:storeId/nguoi-dung`) | |
| `/app/store-staff` | `/app/nhan-vien-cua-hang` | |
| `/app/reports` | `/app/bao-cao` | |
| `/app/rbac` | `/app/phan-quyen` | |
| `/app/forbidden` | `/app/khong-duoc-truy-cap` | |

---

## SYSTEM_ADMIN

### TABLE 1 — Hiển thị menu (UX chuẩn = đủ quyền + không ẩn theo policy frontline)

| Menu | Hiển thị / Ẩn | Điều kiện quyền / role backend | Ghi chú phạm vi store/branch |
|------|----------------|--------------------------------|------------------------------|
| Tổng quan | Hiển thị | `DASHBOARD_VIEW` hoặc `systemManage` | KPI theo service / phạm vi dữ liệu |
| Cửa hàng | Hiển thị | `STORE_VIEW` + cây cửa hàng (gate: `masterRead` ∧ không phải policy BM-only) — với admin: luôn | Toàn hệ thống nếu `systemManage` |
| Chi nhánh (hub / trong store) | Hiển thị | `BRANCH_VIEW` | |
| Kho hàng (hub / trong store) | Hiển thị | `INVENTORY_VIEW` | |
| Thương hiệu | Hiển thị | Quản lý: `PRODUCT_UPDATE` hoặc `systemManage`; đọc: `masterRead` | |
| Danh mục (Nhóm hàng) | Hiển thị | Tương tự Thương hiệu | |
| Đơn vị tính | Hiển thị | Tương tự | |
| Nhà cung cấp | Hiển thị | Đọc `masterRead`; ghi: `GOODS_RECEIPT_CREATE` hoặc `PRODUCT_UPDATE` / `systemManage` | |
| Sản phẩm | Hiển thị | `PRODUCT_VIEW` / tạo `PRODUCT_CREATE` | |
| Khách hàng | Hiển thị | `CUSTOMER_*` tương ứng thao tác | |
| Tồn kho | Hiển thị | `INVENTORY_VIEW` | |
| Biến động kho | Hiển thị | `INVENTORY_TRANSACTION_VIEW` (API list transactions cũng chấp nhận `INVENTORY_VIEW`) | Cần `warehouseId` |
| Phiếu nhập | Hiển thị | `GOODS_RECEIPT_*` | |
| Đơn bán | Hiển thị | `ORDER_*` | |
| Trả hàng | Hiển thị | `RETURN_*` | |
| Chuyển kho | Hiển thị | `TRANSFER_*` | |
| Kiểm kê | Hiển thị | `STOCKTAKE_*` (confirm API = `STOCKTAKE_CREATE`) | |
| Người dùng hệ thống | Hiển thị | `systemManage` (`UserController`) | Global |
| Người dùng cửa hàng | Hiển thị | `USER_VIEW` hoặc `systemManage` | Theo `storeIds` trên API |
| Nhân sự cửa hàng | Hiển thị | `STORE_MANAGER` role **hoặc** `systemManage` (`StoreStaffUserController`) | |
| Báo cáo | Hiển thị | `reportRead` → `REPORT_VIEW` hoặc `REPORT_VIEW_BRANCH` | `null` scope = toàn hệ thống |
| Phân quyền | Hiển thị | `RBAC_MANAGE` / `ROLE_VIEW` / `PERMISSION_VIEW` / `PERMISSION_OVERRIDE_MANAGE` hoặc `systemManage` | Catalog RBAC + override |
| Bán hàng (POS shortcut) | Hiển thị nếu cần UX | `ORDER_CREATE` | Thường dùng cho thu ngân; admin vẫn có quyền |

### TABLE 2 — Truy cập route

| Route | Được vào / Không được vào | Quyền backend liên quan | Cách xử lý nếu truy cập trái phép |
|-------|---------------------------|-------------------------|-----------------------------------|
| `/app/tong-quan` | Được | `DASHBOARD_VIEW` hoặc `systemManage` | SPA: `PermissionRoute` → redirect `getPostLoginRedirectPath` hoặc `/app/khong-duoc-truy-cap` |
| `/app/cua-hang` và cây con | Được | `gateStoreTreePages`: `masterRead` ∧ không `BRANCH_MANAGER` (UX) | Tương tự |
| `/app/chi-nhanh`, `/app/cua-hang/.../chi-nhanh` | Được | `BRANCH_VIEW` + điều kiện gate hub/store | 403 API nếu sai store/branch |
| `/app/kho`, `/app/cua-hang/.../kho` | Được | `INVENTORY_VIEW` + gate | |
| Master `/app/thuong-hieu`, `nhom-hang`, `don-vi`, `nha-cung-cap` | Được | `gateMasterCatalogManagementPages` = `masterRead` ∧ ¬`BRANCH_MANAGER` | BM: vào trang bị chặn ở SPA dù GET brand có thể 403 không? — GET brand chỉ cần `masterRead`; **route** frontend chặn BM |
| `/app/san-pham` (+ `/moi`, `/:id`) | Được | `PRODUCT_VIEW` / `PRODUCT_CREATE` | |
| `/app/khach-hang` | Được | `CUSTOMER_VIEW` | |
| `/app/ton-kho`, `/app/bien-dong-kho` | Được | `INVENTORY_VIEW` / `INVENTORY_TRANSACTION_VIEW` | |
| `/app/phieu-nhap` | Được | `GOODS_RECEIPT_VIEW` / `CREATE` | |
| `/app/don-ban` | Được | `ORDER_VIEW` / `CREATE` | |
| `/app/tra-hang` | Được | `RETURN_VIEW` / `CREATE` | |
| `/app/chuyen-kho` | Được | `TRANSFER_VIEW` / `CREATE` / send / receive | |
| `/app/kiem-kho` | Được | `STOCKTAKE_VIEW` / `CREATE` | |
| `/app/bao-cao` | Được | `REPORT_VIEW` hoặc `REPORT_VIEW_BRANCH` | |
| `/app/nguoi-dung` | Được | `systemManage` | API `/api/users` chỉ `systemManage` |
| `/app/nguoi-dung-cua-hang`, `.../nguoi-dung` | Được | `USER_VIEW` + gate trang trong store | API `StoreScopedUserController` |
| `/app/nhan-vien-cua-hang` | Được | Role `STORE_MANAGER` hoặc `systemManage` | API `@PreAuthorize` role |
| `/app/phan-quyen` | Được | RBAC permissions hoặc `systemManage` | |
| `/app/cai-dat` | Được | `systemManage` only (frontend) | |
| `/app/khong-duoc-truy-cap` | Luôn vào được | — | Trang thông báo |

### TABLE 3 — Nút / hành động (ví dụ)

| Màn hình | Nút / hành động | Hiển thị / Ẩn | Quyền backend liên quan | Điều kiện trạng thái |
|----------|-----------------|---------------|---------------------------|----------------------|
| Cửa hàng | Thêm / Lưu | Hiển thị | `STORE_CREATE` / `STORE_UPDATE` | — |
| Chi nhánh | Thêm / Sửa | Hiển thị | `BRANCH_CREATE` / `BRANCH_UPDATE` | — |
| Thương hiệu / Nhóm / Đơn vị | Thêm / Sửa | Hiển thị | `PRODUCT_UPDATE` | — |
| NCC | Thêm / Sửa | Hiển thị | `GOODS_RECEIPT_CREATE` hoặc `PRODUCT_UPDATE` | — |
| Sản phẩm | Tạo sản phẩm | Hiển thị | `PRODUCT_CREATE` | — |
| Khách hàng | Thêm / Sửa | Hiển thị | `CUSTOMER_CREATE` / `CUSTOMER_UPDATE` | — |
| Phiếu nhập | Tạo / Xác nhận nhập | Hiển thị | `GOODS_RECEIPT_CREATE` / `GOODS_RECEIPT_CONFIRM` | confirm chỉ khi DRAFT |
| Đơn bán | Tạo / Xác nhận thanh toán / Hủy | Hiển thị | `ORDER_CREATE` / `ORDER_CONFIRM` / `ORDER_CANCEL` | trạng thái đơn |
| Trả hàng | Tạo / Xác nhận | Hiển thị | `RETURN_CREATE` (cả confirm API) | DRAFT → confirm |
| Chuyển kho | Tạo / Gửi / Nhận | Hiển thị | `TRANSFER_CREATE` / `SEND` / `RECEIVE` | draft → send → receive |
| Kiểm kê | Tạo / Chốt | Hiển thị | `STOCKTAKE_CREATE` (cả confirm API) | DRAFT → confirm |
| Người dùng HT | Tạo / Khóa / Gán | Hiển thị | `systemManage` + `UserService` | |
| Người dùng cửa hàng | Gán chi nhánh | Hiển thị | `USER_ASSIGN_BRANCH` | trong store |
| Nhân sự CH | Tạo / Đổi chi nhánh | Hiển thị | `STORE_MANAGER` hoặc `systemManage` | API store-staff |
| Phân quyền | Override tạo/xóa | Hiển thị | `PERMISSION_OVERRIDE_MANAGE` | |

### TABLE 4 — Trang đích sau đăng nhập

| Role | Route mặc định | Route fallback | Lý do (backend + SPA) |
|------|------------------|----------------|------------------------|
| SYSTEM_ADMIN | `/app/tong-quan` | `getFirstAccessibleSidebarPath` → `/app/khong-duoc-truy-cap` | Có `DASHBOARD_VIEW`; `getPostLoginRedirectPath` ưu tiên dashboard khi gate đạt |

---

## ADMIN (legacy, tương đương SYSTEM_ADMIN về gate API)

Toàn bộ bốn bảng **giống SYSTEM_ADMIN**: `PermissionBootstrapService` gán **full** permission set cho `ADMIN`; `systemManage()` = `SYSTEM_ADMIN` **hoặc** `ADMIN`. Khác biệt chỉ mang tính **dữ liệu/đặt tên role** trong JWT/DB.

---

## STORE_MANAGER

### TABLE 1 — Menu

| Menu | Hiển thị / Ẩn | Điều kiện quyền / role backend | Ghi chú phạm vi |
|------|----------------|--------------------------------|-----------------|
| Tổng quan | Hiển thị | `DASHBOARD_VIEW` | Theo `storeIds`/`branchIds` trên dữ liệu KPI |
| Cửa hàng | Hiển thị | `STORE_VIEW` + không phải BM | Quản lý cửa hàng đầy đủ |
| Chi nhánh | Hiển thị | `BRANCH_VIEW` | Tạo/sửa: `BRANCH_CREATE`/`UPDATE` |
| Kho hàng | Hiển thị | `INVENTORY_VIEW` | |
| Thương hiệu / Danh mục / Đơn vị / NCC | Hiển thị | `masterRead` + quản lý `PRODUCT_UPDATE` / supplier rule | Trong phạm vi store khi API áp scope |
| Sản phẩm | Hiển thị | `PRODUCT_VIEW`/`CREATE`/`UPDATE` | |
| Khách hàng | Hiển thị | `CUSTOMER_*` | |
| Tồn kho / Biến động | Hiển thị | `INVENTORY_VIEW` / `INVENTORY_TRANSACTION_VIEW` | |
| Phiếu nhập / Đơn / Trả / Chuyển / Kiểm | Hiển thị | Bộ quyền bootstrap đủ `VIEW`/`CREATE`/… | Trả & kiểm: confirm = `CREATE` trên API |
| Người dùng hệ thống | **Ẩn** (không có quyền) | Cần `systemManage` | |
| Người dùng cửa hàng | Hiển thị | `USER_VIEW` | Chỉ các store được gán |
| Nhân sự cửa hàng | Hiển thị | Role `STORE_MANAGER` khớp `StoreStaffUserController` | Chỉ tạo CASHIER / WAREHOUSE_STAFF |
| Báo cáo | Hiển thị | `REPORT_VIEW` | Scope cửa hàng qua `ReportQueryService` |
| Phân quyền | **Ẩn trên sidebar SPA**; API vẫn **403** nếu không có `ROLE_VIEW`/`PERMISSION_VIEW`/… | Bootstrap **không** gán RBAC cho `STORE_MANAGER` | Postman: mục RBAC dành SYSTEM_ADMIN |
| Bán hàng | Có thể hiển thị | `ORDER_CREATE` | SPA không ẩn bằng `isFrontlineCashierNav` |

### TABLE 2 — Route

Giống SYSTEM_ADMIN cho **mọi route nghiệp vụ** có trong bootstrap; **không** vào `/app/nguoi-dung`, `/app/cai-dat` (chỉ systemManage). `/app/phan-quyen`: gate `gateRbacArea` **fail** nếu chỉ đúng bootstrap mặc định (không có `ROLE_VIEW`…).

### TABLE 3 — Nút (điểm khác admin)

| Màn hình | Nút | Hiển thị / Ẩn | Quyền | Trạng thái |
|----------|-----|----------------|--------|------------|
| Phân quyền / User HT | Mọi thao tác | **Ẩn / 403** | `systemManage` hoặc RBAC | — |
| Nhân sự CH | Tạo NV | Hiển thị | `STORE_MANAGER` role trên principal | branch thuộc store |
| Đơn bán | Hủy đơn | Hiển thị | `ORDER_CANCEL` | bootstrap có |

### TABLE 4 — Landing

| Role | Mặc định | Fallback | Lý do |
|------|----------|----------|--------|
| STORE_MANAGER | `/app/tong-quan` | sidebar đầu tiên / `khong-duoc-truy-cap` | Có `DASHBOARD_VIEW`; `getPostLoginRedirectPath` coi SM như nhánh “có dashboard” |

---

## BRANCH_MANAGER

### TABLE 1 — Menu (ưu tiên **quyền** + policy **không** đẩy quản trị cấp cao)

| Menu | Hiển thị / Ẩn | Điều kiện backend | Ghi chú |
|------|----------------|-------------------|---------|
| Tổng quan | Hiển thị | `DASHBOARD_VIEW` | |
| Cửa hàng (cây) | **Ẩn (UX SPA)** | Có `STORE_VIEW` → `masterRead` **đủ** đọc store list API; frontend `gateStoreTreePages` loại BM | Tránh giao diện “quản lý cửa hàng” |
| Chi nhánh hub `/app/chi-nhanh` | **Ẩn (UX SPA)** | `BRANCH_VIEW` | Policy: BM không đi hub chọn store |
| Kho hub `/app/kho` | **Ẩn (UX SPA)** | `INVENTORY_VIEW` | Tương tự |
| Thương hiệu / Danh mục / Đơn vị / NCC | **Ẩn menu quản lý** | Không có `PRODUCT_UPDATE`; chỉ tra cứu qua `masterRead` trong form khác | GET brand/category… với `PRODUCT_VIEW` |
| Sản phẩm | Hiển thị | `PRODUCT_VIEW` | |
| Khách hàng | Hiển thị | `CUSTOMER_*` | |
| Tồn kho / Biến động | Hiển thị | `INVENTORY_VIEW` / `INVENTORY_TRANSACTION_VIEW` | |
| Phiếu nhập / Đơn / Trả / Chuyển / Kiểm | Hiển thị | Đủ trong bootstrap | |
| Người dùng hệ thống / CH / Nhân sự | **Ẩn** | Không `USER_VIEW`; không role store manager | API store users 403 |
| Báo cáo | Hiển thị | `REPORT_VIEW_BRANCH` | Cùng endpoint `/api/reports/summary`, scope theo store |
| Phân quyền | **Ẩn** | Không RBAC permissions | |
| Bán hàng | Tùy UX | `ORDER_CREATE` | Có thể shortcut POS |

### TABLE 2 — Route

| Route | Được vào / Không | Quyền | Xử lý trái phép |
|-------|------------------|--------|-----------------|
| `/app/tong-quan` | Được | `DASHBOARD_VIEW` | Redirect |
| `/app/cua-hang`, master catalog routes | **Không (SPA)** | Gate UX | Redirect landing / forbidden |
| `/app/san-pham`, `khach-hang`, `ton-kho`, `bien-dong-kho` | Được | Tương ứng | |
| `/app/phieu-nhap`, `don-ban`, `tra-hang`, `chuyen-kho`, `kiem-kho` | Được | Bootstrap | API + lifecycle |
| `/app/bao-cao` | Được | `REPORT_VIEW_BRANCH` | |
| `/app/nguoi-dung*`, `phan-quyen`, `nhan-vien-cua-hang` | **Không** | Thiếu quyền / role | `PermissionRoute` |

### TABLE 3 — Nút

| Màn hình | Nút / hành động | Hiển thị / Ẩn | Quyền backend liên quan | Điều kiện trạng thái |
|----------|-----------------|----------------|---------------------------|----------------------|
| Thương hiệu / Nhóm hàng / Đơn vị | Thêm / Lưu | **Ẩn trên SPA** (không vào trang quản lý) | `PRODUCT_UPDATE` hoặc `systemManage` | — |
| Nhà cung cấp | Thêm / Lưu | **Ẩn trên SPA**; **API vẫn có thể** | `POST/PUT /suppliers`: `GOODS_RECEIPT_CREATE` **hoặc** `PRODUCT_UPDATE` — bootstrap BM có `GOODS_RECEIPT_CREATE` | Trang `/app/nha-cung-cap` bị gate `gateMasterCatalogManagementPages` (loại BM) |
| Sản phẩm | Tạo sản phẩm | **Ẩn** | Thiếu `PRODUCT_CREATE` trong bootstrap BM | — |
| Phiếu nhập | Tạo / Xác nhận nhập kho | Hiển thị | `GOODS_RECEIPT_CREATE` / `GOODS_RECEIPT_CONFIRM` | DRAFT → confirm |
| Đơn bán | Tạo / Xác nhận / Hủy | Hiển thị | `ORDER_CREATE` / `ORDER_CONFIRM` / `ORDER_CANCEL` | Theo trạng thái đơn |
| Trả hàng | Tạo / Xác nhận trả | Hiển thị | `RETURN_CREATE` (cả bước confirm API) | DRAFT → confirm |
| Chuyển kho | Tạo / Xuất / Nhận | Hiển thị | `TRANSFER_CREATE` / `TRANSFER_SEND` / `TRANSFER_RECEIVE` | draft → send → receive |
| Kiểm kê | Tạo / Chốt kiểm kê | Hiển thị | `STOCKTAKE_CREATE` (API confirm cùng quyền) | DRAFT → confirm |
| Người dùng / Phân quyền / Nhân sự CH | Các nút quản trị | **Ẩn** | Không `USER_VIEW` / RBAC / role store staff | — |

### TABLE 4 — Landing

| Role | Mặc định | Fallback | Lý do |
|------|----------|----------|--------|
| BRANCH_MANAGER | `/app/tong-quan` | tương tự | `DASHBOARD_VIEW` + nhánh redirect trong `getPostLoginRedirectPath` |

---

## CASHIER

### TABLE 1 — Menu

| Menu | Hiển thị / Ẩn | Điều kiện backend | Ghi chú |
|------|----------------|-------------------|---------|
| Tổng quan | **Ẩn** | Không `DASHBOARD_VIEW` | SPA ẩn sidebar |
| Bán hàng | **Hiển thị** | `ORDER_CREATE` | Menu POS |
| Cửa hàng / Chi nhánh / Kho hub | **Ẩn** | Không `STORE_VIEW` / `BRANCH_VIEW` cho cây | |
| Master danh mục (Thương hiệu, Nhóm hàng, Đơn vị, NCC) | **Ẩn** | Không `PRODUCT_UPDATE`; không vào `gateMasterCatalogManagementPages` | Có `ORDER_CREATE` → đủ `masterRead` cho API đọc chung nhưng SPA không mở khu quản lý danh mục |
| Sản phẩm | Hiển thị | `PRODUCT_VIEW` | |
| Tồn kho | Hiển thị | `INVENTORY_VIEW` | |
| Biến động kho | **Ẩn menu (SPA)** | `GET /api/inventory-transactions` chấp nhận `INVENTORY_VIEW` **hoặc** `INVENTORY_TRANSACTION_VIEW`; CASHIER chỉ có `INVENTORY_VIEW` | Route `/app/bien-dong-kho` yêu cầu `INVENTORY_TRANSACTION_VIEW` → SPA chặn; gọi API trực tiếp vẫn có thể được |
| Phiếu nhập / Trả / Chuyển / Kiểm | **Ẩn** | Thiếu `GOODS_RECEIPT_VIEW`, `RETURN_VIEW`, … | |
| Đơn bán | Hiển thị | `ORDER_VIEW` | |
| Khách hàng | Hiển thị | `CUSTOMER_VIEW` / `CREATE` | Không `UPDATE` |
| Báo cáo / Phân quyền / Users | **Ẩn** | Thiếu quyền | |

### TABLE 2 — Route

| Route | Được vào / Không | Quyền | Trái phép |
|-------|------------------|--------|-----------|
| `/app/don-ban/moi`, `/app/don-ban` | Được | `ORDER_CREATE` / `ORDER_VIEW` | |
| `/app/san-pham` | Được | `PRODUCT_VIEW` | |
| `/app/ton-kho` | Được | `INVENTORY_VIEW` | |
| `/app/bien-dong-kho` | **Không (SPA)** | Gate: `INVENTORY_TRANSACTION_VIEW` (CASHIER bootstrap **không** có) | `PermissionRoute` redirect |
| `/app/khach-hang` | Được | `CUSTOMER_VIEW` | |
| `/app/tong-quan`, `cua-hang`, master catalog, `bao-cao`, `nguoi-dung*`, `phan-quyen`, `phieu-nhap`, `tra-hang`, `chuyen-kho`, `kiem-kho` | **Không** | Thiếu authority tương ứng | `PermissionRoute` → `getPostLoginRedirectPath` hoặc `/app/khong-duoc-truy-cap` |

*(Lệch API vs SPA với biến động kho: xem mục “Mâu thuẫn” số 3.)*

### TABLE 3 — Nút

| Màn hình | Nút / hành động | Hiển thị / Ẩn | Quyền backend | Điều kiện trạng thái |
|----------|-----------------|----------------|-----------------|----------------------|
| Đơn bán | Tạo đơn hàng | Hiển thị | `ORDER_CREATE` | — |
| Đơn bán | Xác nhận thanh toán | Hiển thị | `ORDER_CONFIRM` | Đơn ở trạng thái cho phép xác nhận |
| Đơn bán | Hủy đơn | **Ẩn** | Không có `ORDER_CANCEL` trong bootstrap | — |
| Khách hàng | Thêm khách hàng | Hiển thị | `CUSTOMER_CREATE` | — |
| Khách hàng | Sửa khách hàng | **Ẩn** | Không có `CUSTOMER_UPDATE` | — |
| Trả hàng / Chuyển kho / Kiểm kê / Phiếu nhập | Các nút nghiệp vụ | **Ẩn** | Thiếu `RETURN_VIEW`, `GOODS_RECEIPT_VIEW`, … | — |

### TABLE 4 — Landing

| Role | Mặc định | Fallback | Lý do |
|------|----------|----------|--------|
| CASHIER | `/app/don-ban/moi` | `/app/don-ban` → … | `isFrontlineCashierNav` + `gateOrderCreate` trong `default-landing.ts` |

---

## WAREHOUSE_STAFF

### TABLE 1 — Menu

| Menu | Hiển thị / Ẩn | Điều kiện backend | Ghi chú |
|------|----------------|-------------------|---------|
| Tổng quan | **Ẩn** | Không `DASHBOARD_VIEW` | |
| Bán hàng / Đơn / KH | **Ẩn** | Không `ORDER_*`, `CUSTOMER_*` | SPA ẩn Đơn bán sidebar |
| Sản phẩm | Hiển thị | `PRODUCT_VIEW` | Chỉ tra cứu |
| Tồn kho / Biến động | Hiển thị | `INVENTORY_VIEW` / `INVENTORY_TRANSACTION_VIEW` | |
| Phiếu nhập / Chuyển / Kiểm | Hiển thị | Đủ quyền bootstrap | |
| Trả hàng | **Ẩn** | Không `RETURN_VIEW` | |
| Master quản lý | **Ẩn** | Không `PRODUCT_UPDATE` / không vào gate catalog | |

### TABLE 2 — Route

| Route | Được vào / Không được vào | Quyền backend liên quan | Cách xử lý nếu truy cập trái phép |
|-------|---------------------------|-------------------------|-----------------------------------|
| `/app/ton-kho`, `/app/bien-dong-kho`, `/app/phieu-nhap` (+ `/moi`, `/:id`), `/app/chuyen-kho`, `/app/kiem-kho`, `/app/san-pham` | Được | `INVENTORY_VIEW`, `INVENTORY_TRANSACTION_VIEW`, `GOODS_RECEIPT_*`, `TRANSFER_*`, `STOCKTAKE_*`, `PRODUCT_VIEW` | — |
| `/app/don-ban`, `/app/khach-hang`, `/app/tra-hang`, `/app/tong-quan`, `/app/bao-cao`, hub cửa hàng, master catalog, RBAC | **Không** | Thiếu `ORDER_*`, `CUSTOMER_*`, `RETURN_VIEW`, `DASHBOARD_VIEW`, … | `PermissionRoute` redirect / forbidden |

### TABLE 3 — Nút

| Màn hình | Nút / hành động | Hiển thị / Ẩn | Quyền backend | Điều kiện trạng thái |
|----------|-----------------|----------------|----------------|----------------------|
| Phiếu nhập | Tạo phiếu nhập / Xác nhận nhập kho | Hiển thị | `GOODS_RECEIPT_CREATE` / `GOODS_RECEIPT_CONFIRM` | DRAFT → confirm |
| Chuyển kho | Tạo phiếu / Xuất kho chuyển / Nhập kho nhận | Hiển thị | `TRANSFER_CREATE` / `TRANSFER_SEND` / `TRANSFER_RECEIVE` | draft → send → receive |
| Kiểm kê | Tạo phiếu / Chốt kiểm kê | Hiển thị | `STOCKTAKE_CREATE` (API confirm dùng cùng quyền) | DRAFT → confirm |
| Đơn bán / Khách hàng / Trả hàng | Mọi | **Ẩn** | Không có `ORDER_VIEW`, `CUSTOMER_VIEW`, `RETURN_VIEW` | — |

### TABLE 4 — Landing

| Role | Mặc định | Fallback | Lý do |
|------|----------|----------|--------|
| WAREHOUSE_STAFF | `/app/ton-kho` | `phieu-nhap` → `chuyen-kho` → `kiem-kho` → sidebar | `isFrontlineWarehouseNav` trong `default-landing.ts` |

---

## Tóm tắt ma trận

1. **Hai tầng kiểm tra:** (A) authority từ JWT (`permissions` + role `ROLE_*`), (B) phạm vi `storeIds`/`branchIds` trên từng API. UI chỉ phản ánh (A) qua gate; (B) xử lý khi gọi API (403).
2. **`systemManage`** = `SYSTEM_ADMIN` hoặc `ADMIN` — mở toàn bộ user global, RBAC catalog, settings, và bỏ qua một số guard store theo tài liệu.
3. **STORE_MANAGER** có gần như toàn bộ nghiệp vụ cửa hàng nhưng **không** có quyền RBAC/User hệ thống; **nhân sự cửa hàng** bắt buộc **role** `STORE_MANAGER` trên API (không chỉ permission).
4. **BRANCH_MANAGER** vận hành chi nhánh: đủ đơn/kho/phiếu/chuyển/kiểm/báo cáo nhánh; **không** user admin; UX frontend **cố ý ẩn** hub/cây cửa hàng và trang master catalog dù `masterRead` có thể đúng với một phần GET.
5. **CASHIER** tối thiểu: sản phẩm xem, tồn xem, đơn (xem/tạo/xác nhận), khách (xem/tạo); **không** hủy đơn, **không** sửa khách, **không** trả hàng.
6. **WAREHOUSE_STAFF** tối thiểu: kho + biến động + nhập + chuyển + kiểm + sản phẩm xem; **không** POS/đơn/khách/trả.

---

## Mâu thuẫn / lệch giữa frontend hiện tại và backend

| # | Mô tả |
|---|--------|
| 1 | **Đặt tên route:** tài liệu/Postman dùng tiếng Anh (`/stores`, `/orders`); SPA chính là tiếng Việt; chỉ một phần alias (`dashboard`, `orders`, `inventory`, …) — nhiều path ứng viên **không** có redirect. |
| 2 | **Bootstrap vs controller:** gán `RETURN_CONFIRM`, `STOCKTAKE_CONFIRM` nhưng endpoint confirm dùng **`RETURN_CREATE`**, **`STOCKTAKE_CREATE`** — permission `*_CONFIRM` thừa trên JWT nếu chỉ dùng API hiện tại. |
| 3 | **CASHIER + biến động kho:** `GET /api/inventory-transactions` chấp nhận `INVENTORY_VIEW`; CASHIER có `INVENTORY_VIEW` nhưng **không** có `INVENTORY_TRANSACTION_VIEW`. Route `/app/bien-dong-kho` yêu cầu gate `INVENTORY_TRANSACTION_VIEW` → **SPA chặn**; gọi API trực tiếp vẫn có thể được (nếu client tự build). |
| 4 | **BRANCH_MANAGER + NCC:** có `GOODS_RECEIPT_CREATE` → **POST/PUT supplier** được phép (`MasterDataController`); nhưng **route** quản lý NCC trong SPA bị `gateMasterCatalogManagementPages` loại BM → **không có UI** dù API cho phép. |
| 5 | **STORE_MANAGER + Phân quyền:** `showInSidebar` ẩn menu Phân quyền cho role SM dù về lý thuyết gán thêm `ROLE_VIEW` trong DB sẽ mở gate; cần đồng bộ policy sản phẩm nếu muốn “permission-first” tuyệt đối. |
| 6 | **`StoreStaffUserController`:** chỉ kiểm **role** `STORE_MANAGER` hoặc `systemManage`, **không** dùng permission string — lệch với mô hình “permission trước, role sau” cho khu vực này. |
| 7 | **Đăng ký công khai:** `POST /api/auth/register` luôn gán role mặc định `STORE_MANAGER` (config), không tạo `SYSTEM_ADMIN` qua API (`AuthController` javadoc). |

---

*Tài liệu này chỉ mô tả ma trận và lệch lạc đã kiểm chứng; **chưa** thay đổi mã nguồn ứng dụng.*
