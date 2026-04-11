import type { MeResponse } from "@/types/auth";
import {
  gateGoodsReceiptConfirm,
  gateGoodsReceiptCreate,
  gateOrderCancel,
  gateOrderConfirm,
  gateOrderCreate,
  gateProductCreate,
  gateReturnCreate,
  gateStocktakeCreate,
  gateTransferCreate,
  gateTransferReceive,
  gateTransferSend,
  gateCustomerCreate,
  gateCustomerUpdate,
} from "@/features/auth/gates";

/** Nút và thao tác — khớp ROLE_UI_MATRIX (quyền + trạng thái nghiệp vụ). */

export function canSeeSalesOrderConfirm(me: MeResponse | null, orderStatus: string | undefined): boolean {
  if (!me || !orderStatus) return false;
  return gateOrderConfirm(me) && orderStatus === "draft";
}

export function canSeeSalesOrderCancel(me: MeResponse | null, orderStatus: string | undefined): boolean {
  if (!me || !orderStatus) return false;
  return gateOrderCancel(me) && orderStatus === "draft";
}

export function canSeeSalesOrderCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateOrderCreate(me));
}

export function canSeeGoodsReceiptConfirm(me: MeResponse | null, receiptStatus: string | undefined): boolean {
  if (!me || !receiptStatus) return false;
  return gateGoodsReceiptConfirm(me) && receiptStatus === "draft";
}

export function canSeeGoodsReceiptCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateGoodsReceiptCreate(me));
}

export function canSeeReturnConfirm(me: MeResponse | null, returnStatus: string | undefined): boolean {
  if (!me || !returnStatus) return false;
  return gateReturnCreate(me) && returnStatus === "draft";
}

export function canSeeReturnCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateReturnCreate(me));
}

export function canSeeStocktakeConfirm(me: MeResponse | null, stocktakeStatus: string | undefined): boolean {
  if (!me || !stocktakeStatus) return false;
  return gateStocktakeCreate(me) && stocktakeStatus === "draft";
}

export function canSeeStocktakeCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateStocktakeCreate(me));
}

export function canSeeTransferSend(me: MeResponse | null, transferStatus: string | undefined): boolean {
  if (!me || !transferStatus) return false;
  return gateTransferSend(me) && transferStatus === "draft";
}

export function canSeeTransferReceive(me: MeResponse | null, transferStatus: string | undefined): boolean {
  if (!me || !transferStatus) return false;
  return gateTransferReceive(me) && transferStatus === "sent";
}

export function canSeeTransferCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateTransferCreate(me));
}

export function canSeeProductCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateProductCreate(me));
}

export function canSeeCustomerCreate(me: MeResponse | null): boolean {
  return Boolean(me && gateCustomerCreate(me));
}

export function canSeeCustomerUpdate(me: MeResponse | null): boolean {
  return Boolean(me && gateCustomerUpdate(me));
}
