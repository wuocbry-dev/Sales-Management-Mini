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
@Table(name = "inventories")
@Getter
@Setter
public class Inventory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "inventory_id")
  private Long id;

  @Column(name = "warehouse_id", nullable = false)
  private Long warehouseId;

  /** Cửa hàng sở hữu bản ghi tồn (khớp kho / phiếu). */
  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(name = "quantity_on_hand", nullable = false, precision = 18, scale = 4)
  private BigDecimal quantityOnHand;

  @Column(name = "reserved_qty", nullable = false, precision = 18, scale = 4)
  private BigDecimal reservedQty;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
