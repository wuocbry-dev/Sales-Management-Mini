export type StockTransferLineRequestBody = {
  variantId: number;
  quantity: number | string;
};

export type StockTransferCreateRequestBody = {
  fromWarehouseId: number;
  toWarehouseId: number;
  transferDate: string;
  note?: string | null;
  lines: StockTransferLineRequestBody[];
};

export type StockTransferLineResponse = {
  id: number;
  variantId: number;
  quantity: string;
  /** Có trên API chi tiết phiếu; danh sách có thể null. */
  variantSku?: string | null;
  variantName?: string | null;
  productName?: string | null;
};

export type StockTransferResponse = {
  id: number;
  transferCode: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  /** Có trên API chi tiết; danh sách phân trang có thể null. */
  fromWarehouseCode?: string | null;
  fromWarehouseName?: string | null;
  toWarehouseCode?: string | null;
  toWarehouseName?: string | null;
  transferDate: string;
  status: string;
  note: string | null;
  createdBy: number | null;
  receivedBy: number | null;
  createdAt: string;
  updatedAt: string;
  items: StockTransferLineResponse[];
};
