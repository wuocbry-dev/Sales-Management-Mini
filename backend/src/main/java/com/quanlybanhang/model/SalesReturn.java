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
@Table(name = "sales_returns")
@Getter
@Setter
public class SalesReturn {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "return_id")
  private Long id;

  @Column(name = "return_code", nullable = false, length = 50)
  private String returnCode;

  @Column(name = "order_id", nullable = false)
  private Long orderId;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "customer_id")
  private Long customerId;

  @Column(name = "processed_by", nullable = false)
  private Long processedBy;

  @Column(name = "return_date", nullable = false)
  private LocalDateTime returnDate;

  @Column(nullable = false, length = 9)
  private String status;

  @Column(name = "refund_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal refundAmount;

  @Column(length = 500)
  private String note;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @OneToMany(
      mappedBy = "salesReturn",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<SalesReturnItem> items = new ArrayList<>();

  public void addLine(SalesReturnItem item) {
    items.add(item);
    item.setSalesReturn(this);
  }
}
