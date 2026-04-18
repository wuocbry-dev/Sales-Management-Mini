import type { PaymentLineRequestBody, SalesOrderCreateRequestBody } from "@/types/sales-order";
import type { PosCartLine } from "@/features/pos/types";

export type PosStatus = "idle" | "scanning" | "payment" | "success" | "error";

export type PosState = {
  status: PosStatus;
  message: string | null;
};

export type PosAction =
  | { type: "SCANNING" }
  | { type: "PAYMENT" }
  | { type: "SUCCESS"; message?: string }
  | { type: "ERROR"; message: string }
  | { type: "IDLE" };

export const posInitialState: PosState = {
  status: "idle",
  message: null,
};

export function posMachineReducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case "SCANNING":
      return { status: "scanning", message: null };
    case "PAYMENT":
      return { status: "payment", message: null };
    case "SUCCESS":
      return { status: "success", message: action.message ?? "Thanh toán thành công." };
    case "ERROR":
      return { status: "error", message: action.message };
    case "IDLE":
      return { status: "idle", message: null };
    default:
      return state;
  }
}

export function lineTotal(line: PosCartLine): number {
  return Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
}

export function toDraftPayload(params: {
  storeId: number;
  branchId: number | null;
  lines: PosCartLine[];
  headerDiscountAmount: number;
}): SalesOrderCreateRequestBody {
  return {
    storeId: params.storeId,
    branchId: params.branchId,
    customerId: null,
    orderDate: new Date().toISOString(),
    headerDiscountAmount: Math.max(0, params.headerDiscountAmount),
    note: "POS checkout",
    lines: params.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discountAmount: l.discountAmount,
    })),
  };
}

export function toPaymentLines(params: {
  method: "cash" | "card" | "bank" | "qr";
  totalAmount: number;
}): PaymentLineRequestBody[] {
  const amount = Math.max(0, params.totalAmount);
  if (amount <= 0) {
    return [];
  }

  const methodMap: Record<"cash" | "card" | "bank" | "qr", string> = {
    cash: "CASH",
    card: "CARD",
    bank: "BANK_TRANSFER",
    qr: "EWALLET",
  };

  return [
    {
      paymentType: "SALE",
      paymentMethod: methodMap[params.method],
      amount,
      referenceNo: null,
      note: "POS auto payment",
    },
  ];
}
