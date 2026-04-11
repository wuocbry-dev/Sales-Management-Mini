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
@Table(name = "sales_orders")
@Getter
@Setter
public class SalesOrder {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "order_id")
  private Long id;

  @Column(name = "order_code", nullable = false, length = 50)
  private String orderCode;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  /** Chi nhánh bán hàng — null = trừ tồn kho tổng (CENTRAL) của store. */
  @Column(name = "branch_id")
  private Long branchId;

  @Column(name = "customer_id")
  private Long customerId;

  @Column(name = "cashier_id", nullable = false)
  private Long cashierId;

  @Column(name = "order_date", nullable = false)
  private LocalDateTime orderDate;

  @Column(nullable = false, length = 16)
  private String status;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal subtotal;

  @Column(name = "discount_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal discountAmount;

  @Column(name = "total_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal totalAmount;

  @Column(name = "paid_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal paidAmount;

  @Column(name = "payment_status", nullable = false, length = 8)
  private String paymentStatus;

  @Column(length = 500)
  private String note;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @OneToMany(
      mappedBy = "salesOrder",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<SalesOrderItem> items = new ArrayList<>();

  public void addLine(SalesOrderItem item) {
    items.add(item);
    item.setSalesOrder(this);
  }
}
