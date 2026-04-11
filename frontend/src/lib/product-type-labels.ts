export function productTypeLabel(type: string | null | undefined): string {
  const t = (type ?? "").trim().toUpperCase();
  if (t === "NORMAL") return "Hàng hóa";
  if (t === "SERVICE") return "Dịch vụ";
  if (!t) return "—";
  return type ?? "—";
}
