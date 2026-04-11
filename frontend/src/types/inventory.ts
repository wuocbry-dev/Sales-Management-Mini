/** Khớp backend `InventoryDtos` (JSON camelCase). */

export type InventoryResponse = {
  id: number;
  warehouseId: number;
  storeId: number;
  variantId: number;
  quantityOnHand: string;
  reservedQty: string;
  updatedAt: string;
};

export type InventoryTransactionResponse = {
  id: number;
  warehouseId: number;
  variantId: number;
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
  locations: InventoryLocationAvailability[];
};
