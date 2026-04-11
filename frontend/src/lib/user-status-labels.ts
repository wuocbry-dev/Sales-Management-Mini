/** Nhãn hiển thị cho `me.status` — không in mã thô ra giao diện. */
export function userStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toUpperCase();
  if (!s) return "Chưa xác định";
  if (s === "ACTIVE") return "Đang hoạt động";
  if (s === "INACTIVE") return "Ngừng hoạt động";
  if (s === "LOCKED") return "Đã khóa";
  return "Chưa xác định";
}
