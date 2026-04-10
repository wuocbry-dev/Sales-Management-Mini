package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "product_id")
  private Long id;

  @Column(name = "category_id")
  private Long categoryId;

  @Column(name = "brand_id")
  private Long brandId;

  @Column(name = "unit_id")
  private Long unitId;

  @Column(name = "product_code", nullable = false, length = 50)
  private String productCode;

  @Column(name = "product_name", nullable = false, length = 255)
  private String productName;

  @Column(name = "product_type", nullable = false, length = 7)
  private String productType;

  @Column(name = "has_variant", nullable = false)
  private Boolean hasVariant;

  @Column(name = "track_inventory", nullable = false)
  private Boolean trackInventory;

  @Lob
  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
