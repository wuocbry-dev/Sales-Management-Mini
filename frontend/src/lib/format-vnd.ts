/** Định dạng số tiền VND từ chuỗi số thập phân backend (BigDecimal). */
export function formatVndFromDecimal(value: string | number | null | undefined): string {
  if (value == null || value === "") return "0 ₫";
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return "0 ₫";
  const rounded = Math.round(n);
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ₫`;
}
