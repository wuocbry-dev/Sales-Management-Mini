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
@Table(name = "permissions")
@Getter
@Setter
public class Permission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "permission_id")
  private Long id;

  @Column(name = "permission_code", nullable = false, length = 100, unique = true)
  private String permissionCode;

  @Column(name = "permission_name", nullable = false, length = 150)
  private String permissionName;

  @Column(name = "module_name", nullable = false, length = 100)
  private String moduleName;

  @Column(name = "action_name", nullable = false, length = 50)
  private String actionName;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
