/** Nhãn loại kho theo `warehouseType` backend (CENTRAL | BRANCH). */
export function warehouseTypeLabel(type: string | null | undefined): string {
  const t = (type ?? "").trim().toUpperCase();
  if (t === "CENTRAL") return "Kho tổng cửa hàng";
  if (t === "BRANCH") return "Kho chi nhánh";
  if (!t) return "—";
  return type ?? "—";
}
