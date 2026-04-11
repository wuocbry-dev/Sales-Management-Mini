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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "goods_receipts")
@Getter
@Setter
public class GoodsReceipt {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "receipt_id")
  private Long id;

  @Column(name = "receipt_code", nullable = false, length = 50)
  private String receiptCode;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "warehouse_id", nullable = false)
  private Long warehouseId;

  @Column(name = "supplier_id")
  private Long supplierId;

  @Column(name = "receipt_date", nullable = false)
  private LocalDateTime receiptDate;

  @Column(nullable = false, length = 9)
  private String status;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal subtotal;

  @Column(name = "discount_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal discountAmount;

  @Column(name = "total_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal totalAmount;

  @Column(length = 500)
  private String note;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "approved_by")
  private Long approvedBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany(
      mappedBy = "receipt",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<GoodsReceiptItem> items = new ArrayList<>();

  public void addLine(GoodsReceiptItem item) {
    items.add(item);
    item.setReceipt(this);
  }
}
