package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class GoodsReceiptDtos {

  private GoodsReceiptDtos() {}

  public record GoodsReceiptLineRequest(
      @NotNull Long variantId,
      @NotNull @DecimalMin(value = "0.0001") BigDecimal quantity,
      @NotNull @DecimalMin(value = "0") BigDecimal unitCost,
      @NotNull @DecimalMin(value = "0") BigDecimal discountAmount) {}

  public record GoodsReceiptCreateRequest(
      @NotNull Long storeId,
      Long supplierId,
      @NotNull LocalDateTime receiptDate,
      @NotNull @DecimalMin(value = "0") BigDecimal headerDiscountAmount,
      @Size(max = 500) String note,
      @NotEmpty @Valid List<GoodsReceiptLineRequest> lines) {}

  public record GoodsReceiptLineResponse(
      Long id,
      Long variantId,
      BigDecimal quantity,
      BigDecimal unitCost,
      BigDecimal discountAmount,
      BigDecimal lineTotal) {}

  public record GoodsReceiptResponse(
      Long id,
      String receiptCode,
      Long storeId,
      Long supplierId,
      LocalDateTime receiptDate,
      String status,
      BigDecimal subtotal,
      BigDecimal discountAmount,
      BigDecimal totalAmount,
      String note,
      Long createdBy,
      Long approvedBy,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      List<GoodsReceiptLineResponse> lines) {}
}
