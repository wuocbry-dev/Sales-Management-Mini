package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
public class Supplier {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "supplier_id")
  private Long id;

  @Column(name = "store_id", nullable = false)
  private Long storeId;

  @Column(name = "supplier_code", nullable = false, length = 50)
  private String supplierCode;

  @Column(name = "supplier_name", nullable = false, length = 255)
  private String supplierName;

  @Column(name = "contact_person", length = 150)
  private String contactPerson;

  @Column(length = 20)
  private String phone;

  @Column(length = 100)
  private String email;

  @Column(length = 255)
  private String address;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
