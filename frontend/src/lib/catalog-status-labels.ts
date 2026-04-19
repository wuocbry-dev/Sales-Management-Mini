/** Trạng thái catalog backend dạng `ACTIVE` / `INACTIVE`. */
export function catalogStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "ACTIVE") return "Đang hoạt động";
  if (s === "INACTIVE") return "Ngưng hoạt động";
  if (!s) return "—";
  return status ?? "—";
}

export function catalogStatusTextClass(status: string | null | undefined): string {
  const s = (status ?? "").trim().toUpperCase();
  if (s === "ACTIVE") return "text-green-600";
  if (s === "INACTIVE") return "text-red-600";
  return "";
}
