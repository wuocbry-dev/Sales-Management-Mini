package com.quanlybanhang.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ProductDtos {

  private ProductDtos() {}

  public record ProductVariantRequest(
      @NotBlank @Size(max = 100) String sku,
      @Size(max = 100) String barcode,
      @Size(max = 255) String variantName,
      String attributesJson,
      @NotNull @DecimalMin(value = "0") BigDecimal costPrice,
      @NotNull @DecimalMin(value = "0") BigDecimal sellingPrice,
      @NotNull @DecimalMin(value = "0") BigDecimal reorderLevel,
      @NotBlank @Size(max = 8) String status) {}

  public record ProductCreateRequest(
      Long categoryId,
      Long brandId,
      Long unitId,
      @NotBlank @Size(max = 50) String productCode,
      @NotBlank @Size(max = 255) String productName,
      @NotBlank @Size(max = 7) String productType,
      @NotNull Boolean hasVariant,
      @NotNull Boolean trackInventory,
      String description,
      @NotBlank @Size(max = 8) String status,
      @NotEmpty @Valid List<ProductVariantRequest> variants) {}

  public record ProductVariantResponse(
      Long id,
      Long productId,
      String sku,
      String barcode,
      String variantName,
      String attributesJson,
      BigDecimal costPrice,
      BigDecimal sellingPrice,
      BigDecimal reorderLevel,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record ProductResponse(
      Long id,
      Long categoryId,
      Long brandId,
      Long unitId,
      String productCode,
      String productName,
      String productType,
      Boolean hasVariant,
      Boolean trackInventory,
      String description,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      List<ProductVariantResponse> variants) {}
}
