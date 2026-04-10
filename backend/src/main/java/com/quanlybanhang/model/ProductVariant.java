package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
public class ProductVariant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "variant_id")
  private Long id;

  @Column(name = "product_id", nullable = false)
  private Long productId;

  @Column(nullable = false, length = 100)
  private String sku;

  @Column(length = 100)
  private String barcode;

  @Column(name = "variant_name", length = 255)
  private String variantName;

  @Column(name = "attributes_json", columnDefinition = "json")
  private String attributesJson;

  @Column(name = "cost_price", nullable = false, precision = 18, scale = 4)
  private BigDecimal costPrice;

  @Column(name = "selling_price", nullable = false, precision = 18, scale = 4)
  private BigDecimal sellingPrice;

  @Column(name = "reorder_level", nullable = false, precision = 18, scale = 4)
  private BigDecimal reorderLevel;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
