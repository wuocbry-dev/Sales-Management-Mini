package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class StocktakeDtos {

  private StocktakeDtos() {}

  public record StocktakeLineRequest(
      @NotNull Long variantId,
      @NotNull @DecimalMin(value = "0") BigDecimal actualQty,
      @Size(max = 255) String note) {}

  public record StocktakeCreateRequest(
      @NotNull Long storeId,
      @NotNull LocalDateTime stocktakeDate,
      @Size(max = 500) String note,
      @NotEmpty @Valid List<StocktakeLineRequest> lines) {}

  public record StocktakeLineResponse(
      Long id,
      Long variantId,
      BigDecimal systemQty,
      BigDecimal actualQty,
      BigDecimal differenceQty,
      String note) {}

  public record StocktakeResponse(
      Long id,
      String stocktakeCode,
      Long storeId,
      LocalDateTime stocktakeDate,
      String status,
      String note,
      Long createdBy,
      Long approvedBy,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      List<StocktakeLineResponse> items) {}
}
