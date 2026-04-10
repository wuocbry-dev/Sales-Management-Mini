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
@Table(name = "stock_transfer_items")
@Getter
@Setter
public class StockTransferItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "transfer_item_id")
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "transfer_id", nullable = false)
  private StockTransfer stockTransfer;

  @Column(name = "variant_id", nullable = false)
  private Long variantId;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal quantity;
}
