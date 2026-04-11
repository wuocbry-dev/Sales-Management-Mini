package com.quanlybanhang.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "stock_transfers")
@Getter
@Setter
public class StockTransfer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "transfer_id")
  private Long id;

  @Column(name = "transfer_code", nullable = false, length = 50)
  private String transferCode;

  @Column(name = "from_warehouse_id", nullable = false)
  private Long fromWarehouseId;

  @Column(name = "to_warehouse_id", nullable = false)
  private Long toWarehouseId;

  /** Cửa hàng của kho nguồn (chuyển nội bộ: trùng {@link #toStoreId}). */
  @Column(name = "from_store_id", nullable = false)
  private Long fromStoreId;

  /** Cửa hàng của kho đích. */
  @Column(name = "to_store_id", nullable = false)
  private Long toStoreId;

  @Column(name = "transfer_date", nullable = false)
  private LocalDateTime transferDate;

  @Column(nullable = false, length = 10)
  private String status;

  @Column(length = 500)
  private String note;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "received_by")
  private Long receivedBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany(
      mappedBy = "stockTransfer",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<StockTransferItem> items = new ArrayList<>();

  public void addLine(StockTransferItem item) {
    items.add(item);
    item.setStockTransfer(this);
  }
}
