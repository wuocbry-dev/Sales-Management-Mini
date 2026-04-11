package com.quanlybanhang.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class InventoryDtos {

  private InventoryDtos() {}

  public record InventoryResponse(
      Long id,
      Long warehouseId,
      Long storeId,
      Long variantId,
      String variantSku,
      String variantName,
      BigDecimal quantityOnHand,
      BigDecimal reservedQty,
      LocalDateTime updatedAt) {}

  public record InventoryTransactionResponse(
      Long id,
      Long warehouseId,
      Long variantId,
      String variantSku,
      String variantName,
      String transactionType,
      String referenceType,
      Long referenceId,
      BigDecimal qtyChange,
      BigDecimal qtyBefore,
      BigDecimal qtyAfter,
      BigDecimal unitCost,
      String note,
      Long createdBy,
      LocalDateTime createdAt) {}

  public record InventoryLocationAvailability(
      Long warehouseId,
      String warehouseName,
      String warehouseType,
      Long branchId,
      String branchName,
      BigDecimal quantityOnHand) {}

  public record InventoryAvailabilityResponse(
      Long variantId,
      Long storeId,
      String variantSku,
      String variantName,
      List<InventoryLocationAvailability> locations) {}
}
