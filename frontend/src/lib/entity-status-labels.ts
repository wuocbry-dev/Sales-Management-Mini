/** Nhãn hiển thị cho trạng thái `active` / `inactive` (giá trị backend). */
export function activeInactiveLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "active") return "Đang hoạt động";
  if (s === "inactive") return "Ngưng hoạt động";
  if (!s) return "—";
  return status ?? "—";
}

/** Trạng thái tài khoản người dùng (`ACTIVE` / `INACTIVE` / `LOCKED`). */
export function userAccountStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "ACTIVE") return "Đang hoạt động";
  if (s === "INACTIVE") return "Ngưng hoạt động";
  if (s === "LOCKED") return "Đã khóa";
  if (!s) return "—";
  return status ?? "—";
}
