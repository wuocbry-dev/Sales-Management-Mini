package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class StockTransferDtos {

  private StockTransferDtos() {}

  public record StockTransferLineRequest(
      @NotNull Long variantId,
      @NotNull @DecimalMin(value = "0.0001") BigDecimal quantity) {}

  public record StockTransferCreateRequest(
      @NotNull Long fromStoreId,
      @NotNull Long toStoreId,
      @NotNull LocalDateTime transferDate,
      @Size(max = 500) String note,
      @NotEmpty @Valid List<StockTransferLineRequest> lines) {}

  public record StockTransferLineResponse(Long id, Long variantId, BigDecimal quantity) {}

  public record StockTransferResponse(
      Long id,
      String transferCode,
      Long fromStoreId,
      Long toStoreId,
      LocalDateTime transferDate,
      String status,
      String note,
      Long createdBy,
      Long receivedBy,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      List<StockTransferLineResponse> items) {}
}
