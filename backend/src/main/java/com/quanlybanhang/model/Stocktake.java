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
@Table(name = "stocktakes")
@Getter
@Setter
public class Stocktake {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "stocktake_id")
  private Long id;

  @Column(name = "stocktake_code", nullable = false, length = 50)
  private String stocktakeCode;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "stocktake_date", nullable = false)
  private LocalDateTime stocktakeDate;

  @Column(nullable = false, length = 9)
  private String status;

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
      mappedBy = "stocktake",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  private List<StocktakeItem> items = new ArrayList<>();

  public void addLine(StocktakeItem item) {
    items.add(item);
    item.setStocktake(this);
  }
}
