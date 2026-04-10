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
@Table(name = "units")
@Getter
@Setter
public class Unit {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "unit_id")
  private Long id;

  @Column(name = "unit_code", nullable = false, length = 50)
  private String unitCode;

  @Column(name = "unit_name", nullable = false, length = 100)
  private String unitName;

  @Column(length = 255)
  private String description;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
