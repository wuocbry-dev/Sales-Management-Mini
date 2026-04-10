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
@Table(name = "stocktake_items")
@Getter
@Setter
public class StocktakeItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "stocktake_item_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "stocktake_id", nullable = false)
  private Stocktake stocktake;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(name = "system_qty", nullable = false, precision = 18, scale = 4)
  private BigDecimal systemQty;

  @Column(name = "actual_qty", nullable = false, precision = 18, scale = 4)
  private BigDecimal actualQty;

  @Column(name = "difference_qty", nullable = false, precision = 18, scale = 4)
  private BigDecimal differenceQty;

  @Column(length = 255)
  private String note;
}
