/** Nhãn hiển thị cho trạng thái `active` / `inactive` (giá trị backend). */
export function activeInactiveLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "active") return "Đang hoạt động";
  if (s === "inactive") return "Ngưng hoạt động";
  if (!s) return "—";
  return status ?? "—";
}

export function activeInactiveTextClass(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "active") return "text-green-600";
  if (s === "inactive") return "text-red-600";
  return "";
}

/** Nhãn nút cho hành vi soft-delete/toggle status: active = Tắt, inactive = Bật. */
export function softDeleteToggleLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "inactive") return "Bật";
  return "Tắt";
}

export function softDeleteToggleLoadingLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "inactive") return "Đang bật...";
  return "Đang tắt...";
}

export function softDeleteToggleConfirmVerb(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "inactive") return "Bật";
  return "Tắt";
}

export function softDeleteToggleSuccessVerb(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "inactive") return "bật";
  return "tắt";
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

export function userAccountStatusTextClass(status: string | null | undefined): string {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "ACTIVE") return "text-green-600";
  if (s === "INACTIVE") return "text-red-600";
  return "";
}
