package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class SalesReturnDtos {

  private SalesReturnDtos() {}

  public record SalesReturnLineRequest(
      @NotNull Long orderItemId,
      @NotNull Long variantId,
      @NotNull @DecimalMin(value = "0.0001") BigDecimal quantity,
      @NotNull @DecimalMin(value = "0") BigDecimal unitPrice,
      @Size(max = 255) String reason) {}

  public record SalesReturnCreateRequest(
      @NotNull Long orderId,
      @NotNull Long storeId,
      Long customerId,
      @NotNull LocalDateTime returnDate,
      @Size(max = 500) String note,
      @NotEmpty @Valid List<SalesReturnLineRequest> lines) {}

  public record SalesReturnLineResponse(
      Long id,
      Long orderItemId,
      Long variantId,
      BigDecimal quantity,
      BigDecimal unitPrice,
      BigDecimal lineTotal,
      String reason) {}

  public record SalesReturnResponse(
      Long id,
      String returnCode,
      Long orderId,
      Long storeId,
      Long customerId,
      Long processedBy,
      LocalDateTime returnDate,
      String status,
      BigDecimal refundAmount,
      String note,
      LocalDateTime createdAt,
      List<SalesReturnLineResponse> items) {}
}
