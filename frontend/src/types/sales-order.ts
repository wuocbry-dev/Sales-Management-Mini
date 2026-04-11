export type SalesOrderLineRequestBody = {
  variantId: number;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount: number | string;
};

export type SalesOrderCreateRequestBody = {
  storeId: number;
  branchId?: number | null;
  customerId?: number | null;
  orderDate: string;
  headerDiscountAmount: number | string;
  note?: string | null;
  lines: SalesOrderLineRequestBody[];
};

export type PaymentLineRequestBody = {
  paymentType: string;
  paymentMethod: string;
  amount: number | string;
  referenceNo?: string | null;
  note?: string | null;
};

export type SalesOrderConfirmRequestBody = {
  payments: PaymentLineRequestBody[];
};

export type SalesOrderItemResponse = {
  id: number;
  variantId: number;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
};

export type PaymentResponse = {
  id: number;
  storeId: number;
  orderId: number | null;
  paymentType: string;
  paymentMethod: string;
  amount: string;
  referenceNo: string | null;
  note: string | null;
  paidAt: string;
  createdBy: number;
  createdAt: string;
};

export type SalesOrderResponse = {
  id: number;
  orderCode: string;
  storeId: number;
  branchId: number | null;
  customerId: number | null;
  cashierId: number | null;
  orderDate: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  totalAmount: string;
  paidAmount: string;
  paymentStatus: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: SalesOrderItemResponse[];
  payments: PaymentResponse[];
};
