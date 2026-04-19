/** Khớp backend `InventoryDtos` (JSON camelCase). */

export type InventoryResponse = {
  id: number;
  warehouseId: number;
  storeId: number;
  variantId: number;
  variantSku?: string | null;
  productName?: string | null;
  variantName?: string | null;
  quantityOnHand: string;
  reservedQty: string;
  updatedAt: string;
};

export type InventoryTransactionResponse = {
  id: number;
  warehouseId: number;
  variantId: number;
  variantSku?: string | null;
  productName?: string | null;
  variantName?: string | null;
  transactionType: string;
  referenceType: string | null;
  referenceId: number | null;
  qtyChange: string;
  qtyBefore: string;
  qtyAfter: string;
  unitCost: string | null;
  note: string | null;
  createdBy: number;
  createdAt: string;
};

export type InventoryLocationAvailability = {
  warehouseId: number;
  warehouseName: string;
  warehouseType: string;
  branchId: number | null;
  branchName: string | null;
  quantityOnHand: string;
};

export type InventoryAvailabilityResponse = {
  variantId: number;
  storeId: number;
  variantSku?: string | null;
  productName?: string | null;
  variantName?: string | null;
  locations: InventoryLocationAvailability[];
};
