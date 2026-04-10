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
@Table(name = "goods_receipt_items")
@Getter
@Setter
public class GoodsReceiptItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "receipt_item_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "receipt_id", nullable = false)
  private GoodsReceipt receipt;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal quantity;

  @Column(name = "unit_cost", nullable = false, precision = 18, scale = 4)
  private BigDecimal unitCost;

  @Column(name = "discount_amount", nullable = false, precision = 18, scale = 4)
  private BigDecimal discountAmount;

  @Column(name = "line_total", nullable = false, precision = 18, scale = 4)
  private BigDecimal lineTotal;
}
