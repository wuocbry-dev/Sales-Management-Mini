package com.quanlybanhang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class MasterDataDtos {

  private MasterDataDtos() {}

  public record StoreRequest(
      @NotBlank @Size(max = 50) String storeCode,
      @NotBlank @Size(max = 255) String storeName,
      @Size(max = 20) String phone,
      @Size(max = 100) String email,
      @Size(max = 255) String address,
      @NotBlank @Size(max = 8) String status) {}

  public record StoreResponse(
      Long id,
      String storeCode,
      String storeName,
      String phone,
      String email,
      String address,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record BrandRequest(
      @NotBlank @Size(max = 50) String brandCode,
      @NotBlank @Size(max = 150) String brandName,
      @Size(max = 255) String description,
      @NotBlank @Size(max = 8) String status) {}

  public record BrandResponse(
      Long id,
      String brandCode,
      String brandName,
      String description,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record CategoryRequest(
      Long parentId,
      @NotBlank @Size(max = 50) String categoryCode,
      @NotBlank @Size(max = 150) String categoryName,
      @Size(max = 255) String description,
      @NotBlank @Size(max = 8) String status) {}

  public record CategoryResponse(
      Long id,
      Long parentId,
      String categoryCode,
      String categoryName,
      String description,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}

  public record UnitRequest(
      @NotBlank @Size(max = 50) String unitCode,
      @NotBlank @Size(max = 100) String unitName,
      @Size(max = 255) String description) {}

  public record UnitResponse(
      Long id, String unitCode, String unitName, String description, LocalDateTime createdAt) {}

  public record SupplierRequest(
      @NotBlank @Size(max = 50) String supplierCode,
      @NotBlank @Size(max = 255) String supplierName,
      @Size(max = 150) String contactPerson,
      @Size(max = 20) String phone,
      @Size(max = 100) String email,
      @Size(max = 255) String address,
      @NotBlank @Size(max = 8) String status) {}

  public record SupplierResponse(
      Long id,
      String supplierCode,
      String supplierName,
      String contactPerson,
      String phone,
      String email,
      String address,
      String status,
      LocalDateTime createdAt,
      LocalDateTime updatedAt) {}
}
