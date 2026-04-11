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
};

export type StockTransferResponse = {
  id: number;
  transferCode: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  transferDate: string;
  status: string;
  note: string | null;
  createdBy: number | null;
  receivedBy: number | null;
  createdAt: string;
  updatedAt: string;
  items: StockTransferLineResponse[];
};
