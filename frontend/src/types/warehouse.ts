/** Khớp `WarehouseDtos.WarehouseResponse`. */

export type WarehouseResponse = {
  warehouseId: number;
  storeId: number;
  branchId: number | null;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  status: string;
};
