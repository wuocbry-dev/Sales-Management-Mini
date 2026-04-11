export type SalesReturnLineRequestBody = {
  orderItemId: number;
  variantId: number;
  quantity: number | string;
  unitPrice: number | string;
  reason?: string | null;
};

export type SalesReturnCreateRequestBody = {
  orderId: number;
  storeId: number;
  customerId?: number | null;
  returnDate: string;
  note?: string | null;
  lines: SalesReturnLineRequestBody[];
};

export type SalesReturnLineResponse = {
  id: number;
  orderItemId: number;
  variantId: number;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  reason: string | null;
};

export type SalesReturnResponse = {
  id: number;
  returnCode: string;
  orderId: number;
  storeId: number;
  customerId: number | null;
  processedBy: number | null;
  returnDate: string;
  status: string;
  refundAmount: string;
  note: string | null;
  createdAt: string;
  items: SalesReturnLineResponse[];
};
