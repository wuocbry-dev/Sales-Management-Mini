const MAP: Record<string, string> = {
  OPENING: "Tồn đầu kỳ",
  PURCHASE: "Nhập mua",
  SALE: "Bán hàng",
  SALE_RETURN: "Trả hàng bán",
  TRANSFER_IN: "Nhận chuyển kho",
  TRANSFER_OUT: "Xuất chuyển kho",
  STOCKTAKE_ADJUST: "Điều chỉnh kiểm kho",
  MANUAL_ADJUST: "Điều chỉnh tay",
};

export function inventoryTransactionTypeLabel(code: string | null | undefined): string {
  const k = (code ?? "").trim().toUpperCase();
  if (!k) return "—";
  return MAP[k] ?? code ?? "—";
}
