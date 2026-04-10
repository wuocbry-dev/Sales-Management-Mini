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
@Table(name = "payments")
@Getter
@Setter
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "payment_id")
  private Long id;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "order_id")
  private Long orderId;

  @Column(name = "return_id")
  private Long returnId;

  @Column(name = "payment_type", nullable = false, length = 6)
  private String paymentType;

  @Column(name = "payment_method", nullable = false, length = 13)
  private String paymentMethod;

  @Column(nullable = false, precision = 18, scale = 4)
  private BigDecimal amount;

  @Column(name = "reference_no", length = 100)
  private String referenceNo;

  @Column(length = 255)
  private String note;

  @Column(name = "paid_at", nullable = false)
  private LocalDateTime paidAt;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
