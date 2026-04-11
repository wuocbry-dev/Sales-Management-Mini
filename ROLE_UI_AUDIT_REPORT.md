# Báo cáo kiểm tra giao diện theo vai trò (ROLE_UI_AUDIT_REPORT)

Đối chiếu **backend** (`@PreAuthorize`, bootstrap quyền), **Postman**, **`ROLE_UI_MATRIX.md`** và mã **frontend** (menu, route, nút, landing, chuỗi hiển thị). Không thêm hành vi giả lập API; phần không khớp được **sửa ở UI** (ẩn / chặn / chuỗi thân thiện).

---

## Tóm tắt thay đổi đã áp dụng

| Vấn đề | Vai trò / phạm vi | Màn hình / route | Nguyên nhân gốc | Cách xử lý | Kết quả |
|--------|-------------------|------------------|-----------------|------------|---------|
| Menu **Bán hàng** không hiện với quản lý cửa hàng có `ORDER_CREATE` | `STORE_MANAGER` | Sidebar → `/app/don-ban/moi` | `sidebarVisible` của mục `ban-hang` chỉ gồm thu ngân và chi nhánh + `ORDER_CREATE`, bỏ sót SM | Thêm điều kiện `isStoreManagerRole(me) && gateOrderCreate(me)` trong `menu-config.ts` | SM có shortcut POS giống ma trận UX |
| Liên kết **Người dùng trong cửa hàng** ẩn nhầm với quản trị hệ thống | `SYSTEM_ADMIN`, `ADMIN` (có `USER_VIEW` + cây cửa hàng) | `/app/cua-hang/:storeId` | Điều kiện cũ: `gateStoreScopedUserView && !isSystemManage` — loại sai người có `systemManage` | Dùng `gateStoreScopedUsersInStorePage` (đồng bộ `route-access` / `PermissionRoute`) | Admin thấy liên kết khi đủ gate cây cửa hàng + quyền người dùng cửa hàng |
| Tab **Biến động tồn** trên trang tồn kho cho user không có quyền trang biến động riêng | Đặc biệt `CASHIER` (chỉ `INVENTORY_VIEW`, không có `INVENTORY_TRANSACTION_VIEW` theo bootstrap) | `/app/ton-kho` | Cùng component với tab giao dịch; API `GET /api/inventory-transactions` chấp nhận cả `INVENTORY_VIEW` nhưng **ma trận UX** chặn `/app/bien-dong-kho` và ẩn menu biến động — tab tạo lệch “vào được nhật ký” qua tồn kho | Chỉ hiển thị tab và mô tả khi `gateInventoryTransactionView(me)`; `useEffect` đưa tab về `by_wh` nếu đang ở `transactions` mà không đủ quyền | Không còn đường tắt UI tới nhật ký biến động cho vai trò mà ma trận không mở trang biến động |
| Lỗi API hiển thị chuỗi tiếng Anh / mã thô | Mọi vai trò | Toast / khối lỗi dùng `formatApiError` | Fallback trả về `data.message` khi `code` không nằm trong map | Với `code` không map: thông báo tiếng Việt cố định, không lộ message máy chủ | Giảm rò rỉ “API note” / tiếng Anh kỹ thuật |
| Đăng xuất xóa cache sai query key | Mọi vai trò | Menu tài khoản | `removeQueries({ queryKey: ["auth"] })` không khớp `AUTH_ME_QUERY_KEY` (`["auth","me"]`) | Dùng `AUTH_ME_QUERY_KEY` như `protected-route` / login | Phiên `/me` được dọn nhất quán |
| `canAccessRoute` không gán gate cho alias `/app/returns` | Mọi vai trò có quyền trả hàng | Đường dẫn tiếng Anh (redirect → `tra-hang`) | `ROUTE_RULES` chỉ có `/app/tra-hang*` | Thêm khớp song song `returns` với cùng gate như `tra-hang` | Landing / kiểm route không “mở” nhầm khi dùng path alias |

---

## Ghi chú đối chiếu backend (không đổi code backend)

- **`GET /api/inventory-transactions`**: `@PreAuthorize` cho phép `INVENTORY_VIEW` **hoặc** `INVENTORY_TRANSACTION_VIEW`. Tab trên `/app/ton-kho` được **thu hẹp theo policy SPA** trong `ROLE_UI_MATRIX.md` (CASHIER không có UX biến động kho dù API rộng hơn).
- **Xóa dòng** trên form tạo (đơn, phiếu, …): là xóa dòng cục bộ trên form, không map tới endpoint DELETE — không xếp loại “nút xóa giả”.

---

## Hạng mục kiểm tra (trạng thái)

1. **Menu visibility** — Đã rà `menu-config.ts` + gates; sửa POS cho SM; tab tồn/biến động đồng bộ ma trận.
2. **Route accessibility** — `routes/index.tsx` + `permission-route` + `route-access.ts` đồng bộ; bổ sung alias `returns`.
3. **Action buttons** — Không phát hiện thêm sai sót trong phạm vi diff này; các gate nghiệp vụ vẫn theo `gates.ts` / từng trang (đã có từ trước).
4. **Role landing** — `default-landing.ts` + `isFrontlineCashierNav` / warehouse / admin path; không đổi logic trong đợt này (đã khớp ma trận).
5. **Vietnamese business UX** — Cải thiện `formatApiError`; không thấy Postman tên request hay HTTP method trên UI trong phạm vi sửa.
6. **Dead UI** — Không thêm nút gọi API không tồn tại; không mock backend.

---

## Xác nhận build

- `frontend`: `npm run build` (Vite) — **thành công** sau các thay đổi.

---

## Kết luận

Các lệch đã biết giữa **ROLE_UI_MATRIX**, **route/gate** và **menu** trong phạm vi audit này đã được xử lý. Vẫn nên kiểm tra tay từng luồng nghiệp vụ (POS, phiếu, trả hàng) sau khi gán quyền tùy chỉnh ngoài bootstrap.
