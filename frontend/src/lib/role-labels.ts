/**
 * Mô tả tiếng Việt đồng bộ seed `roles.description` trong DB
 * (dùng khi API chỉ trả `roleCode` hoặc thiếu `description`).
 */
const ROLE_CODE_DESCRIPTION_VI: Record<string, string> = {
  SYSTEM_ADMIN: "Quản trị toàn hệ thống (JWT/RBAC đầy đủ)",
  ADMIN: "Tương đương quyền cao — giữ tương thích DB cũ",
  STORE_MANAGER: "Quản lý cửa hàng",
  BRANCH_MANAGER: "Quản lý chi nhánh / vận hành không tạo cửa hàng",
  CASHIER: "Thu ngân / nhân viên bán hàng",
  WAREHOUSE_STAFF: "Nhân viên kho",
};

/** Nhãn hiển thị cho một mã vai trò (JWT `me.roles` thường là mã này). */
export function roleCodeDescriptionVi(code: string | null | undefined): string {
  if (code == null || String(code).trim() === "") return "—";
  const key = String(code).trim().toUpperCase();
  return ROLE_CODE_DESCRIPTION_VI[key] ?? key;
}

type RoleLike = { roleCode: string; description?: string | null };

/** Ưu tiên `description` từ API, sau đó map cố định. */
export function roleUiLabel(row: RoleLike): string {
  const d = row.description?.trim();
  if (d) return d;
  return roleCodeDescriptionVi(row.roleCode);
}

/** Danh sách mã vai trò → chuỗi mô tả, cách nhau bởi dấu phẩy. */
export function formatRoleCodesForUi(codes: string[] | null | undefined): string {
  if (!codes?.length) return "—";
  return codes.map((c) => roleCodeDescriptionVi(c)).join(", ");
}
