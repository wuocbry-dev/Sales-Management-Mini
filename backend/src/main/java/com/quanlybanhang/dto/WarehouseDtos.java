package com.quanlybanhang.dto;

public final class WarehouseDtos {

  private WarehouseDtos() {}

  public record WarehouseResponse(
      Long warehouseId,
      Long storeId,
      Long branchId,
      String warehouseCode,
      String warehouseName,
      String warehouseType,
      String status) {}
}
