export type GoodsReceiptLineRequestBody = {
  variantId: number;
  quantity: number | string;
  unitCost: number | string;
  discountAmount: number | string;
};

export type GoodsReceiptCreateRequestBody = {
  storeId: number;
  warehouseId?: number | null;
  supplierId?: number | null;
  receiptDate: string;
  headerDiscountAmount: number | string;
  note?: string | null;
  lines: GoodsReceiptLineRequestBody[];
};

export type GoodsReceiptLineResponse = {
  id: number;
  variantId: number;
  quantity: string;
  unitCost: string;
  discountAmount: string;
  lineTotal: string;
};

export type GoodsReceiptResponse = {
  id: number;
  receiptCode: string;
  storeId: number;
  warehouseId: number;
  supplierId: number | null;
  receiptDate: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  note: string | null;
  createdBy: number;
  approvedBy: number | null;
  createdAt: string;
  updatedAt: string;
  lines: GoodsReceiptLineResponse[];
};
