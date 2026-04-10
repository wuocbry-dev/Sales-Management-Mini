package com.quanlybanhang.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class InventoryDtos {

  private InventoryDtos() {}

  public record InventoryResponse(
      Long id,
      Long storeId,
      Long variantId,
      BigDecimal quantityOnHand,
      BigDecimal reservedQty,
      LocalDateTime updatedAt) {}

  public record InventoryTransactionResponse(
      Long id,
      Long storeId,
      Long variantId,
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
}
