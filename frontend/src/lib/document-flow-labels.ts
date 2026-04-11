/** Nhãn trạng thái nghiệp vụ (giá trị thô từ backend, không hiển thị mã kỹ thuật ra UI nếu không cần). */

export function goodsReceiptStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "draft") return "Bản nháp";
  if (s === "completed") return "Đã nhập kho";
  if (s === "cancelled") return "Đã hủy";
  return status ?? "—";
}

export function salesOrderStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "draft") return "Bản nháp";
  if (s === "completed") return "Đã hoàn tất";
  if (s === "cancelled") return "Đã hủy";
  return status ?? "—";
}

export function paymentStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "unpaid") return "Chưa thanh toán";
  if (s === "paid") return "Đã thanh toán";
  return status ?? "—";
}

export function salesReturnStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "draft") return "Bản nháp";
  if (s === "completed") return "Đã hoàn tất";
  return status ?? "—";
}

export function stockTransferStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "draft") return "Bản nháp";
  if (s === "sent") return "Đang chuyển";
  if (s === "completed") return "Đã nhận xong";
  return status ?? "—";
}

export function stocktakeStatusLabel(status: string | null | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "draft") return "Bản nháp";
  if (s === "completed") return "Đã chốt";
  return status ?? "—";
}

export function paymentMethodLabel(code: string | null | undefined): string {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "CASH") return "Tiền mặt";
  if (c === "BANK_TRANSFER") return "Chuyển khoản";
  if (c === "CARD") return "Thẻ";
  if (c === "EWALLET") return "Ví điện tử";
  if (c === "OTHER") return "Khác";
  return code ?? "—";
}

export function paymentTypeLabel(code: string | null | undefined): string {
  const c = (code ?? "").trim().toUpperCase();
  if (c === "SALE") return "Thu bán hàng";
  if (c === "REFUND") return "Hoàn tiền";
  if (c === "IN") return "Thu vào";
  return code ?? "—";
}
