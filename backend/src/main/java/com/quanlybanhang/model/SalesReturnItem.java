package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "sales_return_items")
@Getter
@Setter
public class SalesReturnItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "return_item_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "return_id", nullable = false)
  private SalesReturn salesReturn;

  @Column(name = "order_item_id")
  private Long orderItemId;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal quantity;

  @Column(name = "unit_price", nullable = false, precision = 18, scale = 4)
  private BigDecimal unitPrice;

  @Column(name = "line_total", nullable = false, precision = 18, scale = 4)
  private BigDecimal lineTotal;

  @Column(length = 255)
  private String reason;
}
