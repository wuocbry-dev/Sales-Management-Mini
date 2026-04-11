export type StocktakeLineRequestBody = {
  variantId: number;
  actualQty: number | string;
  note?: string | null;
};

export type StocktakeCreateRequestBody = {
  storeId: number;
  warehouseId: number;
  stocktakeDate: string;
  note?: string | null;
  lines: StocktakeLineRequestBody[];
};

export type StocktakeLineResponse = {
  id: number;
  variantId: number;
  systemQty: string;
  actualQty: string;
  differenceQty: string;
  note: string | null;
};

export type StocktakeResponse = {
  id: number;
  stocktakeCode: string;
  storeId: number;
  warehouseId: number;
  stocktakeDate: string;
  status: string;
  note: string | null;
  createdBy: number | null;
  approvedBy: number | null;
  createdAt: string;
  updatedAt: string;
  items: StocktakeLineResponse[];
};
