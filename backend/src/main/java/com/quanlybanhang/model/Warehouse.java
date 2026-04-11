package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "warehouses")
@Getter
@Setter
public class Warehouse {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "warehouse_id")
  private Long id;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  /** Null khi {@code warehouse_type} = CENTRAL (kho tổng store). */
  @Column(name = "branch_id")
  private Long branchId;

  @Column(name = "warehouse_code", nullable = false, length = 50)
  private String warehouseCode;

  @Column(name = "warehouse_name", nullable = false, length = 255)
  private String warehouseName;

  /** CENTRAL | BRANCH — khớp ENUM MySQL. */
  @Column(name = "warehouse_type", nullable = false, length = 16)
  private String warehouseType;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
