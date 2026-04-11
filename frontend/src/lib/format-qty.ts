/** Định dạng số lượng tồn / biến động (BigDecimal dạng chuỗi). */
export function formatQty(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(n);
}
