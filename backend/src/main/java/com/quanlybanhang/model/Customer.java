package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customers")
@Getter
@Setter
public class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "customer_id")
  private Long id;

  @Column(name = "customer_code", nullable = false, length = 50)
  private String customerCode;

  @Column(name = "full_name", nullable = false, length = 150)
  private String fullName;

  @Column(length = 20)
  private String phone;

  @Column(length = 100)
  private String email;

  @Column(length = 6)
  private String gender;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(length = 255)
  private String address;

  @Column(name = "loyalty_points", nullable = false)
  private Integer loyaltyPoints;

  @Column(name = "total_spent", nullable = false, precision = 18, scale = 4)
  private BigDecimal totalSpent;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
