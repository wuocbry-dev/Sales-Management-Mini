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

  /**
   * Cập nhật sản phẩm: {@code id} null = thêm biến thể mới; có {@code id} = cập nhật. Biến thể có
   * {@code id} nhưng không nằm trong payload sẽ bị xóa nếu chưa phát sinh tham chiếu kho/đơn.
   */
  public record ProductVariantUpsertRequest(
      Long id,
      @NotBlank @Size(max = 100) String sku,
      @Size(max = 100) String barcode,
      @Size(max = 255) String variantName,
      String attributesJson,
      @NotNull @DecimalMin(value = "0") BigDecimal costPrice,
      @NotNull @DecimalMin(value = "0") BigDecimal sellingPrice,
      @NotNull @DecimalMin(value = "0") BigDecimal reorderLevel,
      @NotBlank @Size(max = 8) String status) {}

  public record ProductUpdateRequest(
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
      @NotEmpty @Valid List<ProductVariantUpsertRequest> variants) {}

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
      /** Cửa hàng sở hữu catalog; bắt buộc với quản trị đa cửa hàng, có thể bỏ qua nếu JWT chỉ một cửa hàng. */
      Long storeId,
      @NotBlank @Size(max = 50) String productCode,
      @NotBlank @Size(max = 255) String productName,
      @NotBlank @Size(max = 7) String productType,
      @NotNull Boolean hasVariant,
      @NotNull Boolean trackInventory,
      String description,
      @NotBlank @Size(max = 8) String status,
      @NotEmpty @Valid List<ProductVariantRequest> variants) {}

  /** Gợi ý biến thể khi tìm theo SKU / tên (phiếu nhập, v.v.). */
  public record ProductVariantOptionResponse(
      Long variantId,
      String sku,
      String variantName,
      String productName,
      BigDecimal sellingPrice) {}

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

  public record ProductImageResponse(
      Long imageId,
      Integer sortOrder,
      String contentType,
      String fileName,
      String imageUrl,
      LocalDateTime createdAt) {}

  public record ProductResponse(
      Long id,
      Long storeId,
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
    List<ProductVariantResponse> variants,
    List<ProductImageResponse> images) {}
}
