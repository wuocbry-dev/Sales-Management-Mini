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
@Table(name = "inventory_transactions")
@Getter
@Setter
public class InventoryTransaction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "transaction_id")
  private Long id;

  @Column(name = "warehouse_id", nullable = false)
  private Long warehouseId;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(name = "transaction_type", nullable = false, length = 16)
  private String transactionType;

  @Column(name = "reference_type", length = 50)
  private String referenceType;

  @Column(name = "reference_id")
  private Long referenceId;

  @Column(name = "qty_change", nullable = false, precision = 18, scale = 4)
  private BigDecimal qtyChange;

  @Column(name = "qty_before", nullable = false, precision = 18, scale = 4)
  private BigDecimal qtyBefore;

  @Column(name = "qty_after", nullable = false, precision = 18, scale = 4)
  private BigDecimal qtyAfter;

  @Column(name = "unit_cost", precision = 18, scale = 4)
  private BigDecimal unitCost;

  @Column(length = 255)
  private String note;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
