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
@Table(name = "role_permission_overrides")
@Getter
@Setter
public class RolePermissionOverride {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "override_id")
  private Long id;

  @Column(name = "role_id", nullable = false)
  private Long roleId;

  @Column(name = "permission_id", nullable = false)
  private Long permissionId;

  @Column(name = "store_id")
  private Long storeId;

  @Column(name = "branch_id")
  private Long branchId;

  @Column(name = "override_type", nullable = false, length = 10)
  private String overrideType;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
}
