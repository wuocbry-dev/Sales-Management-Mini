package com.quanlybanhang.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Bảng gán role–permission (`role_permissions`). */
@Entity
@Table(name = "role_permissions")
@Getter
@Setter
@NoArgsConstructor
public class RolePermission {

  @Embeddable
  @Getter
  @Setter
  @NoArgsConstructor
  public static class Pk implements Serializable {
    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Column(name = "permission_id", nullable = false)
    private Long permissionId;

    public Pk(Long roleId, Long permissionId) {
      this.roleId = roleId;
      this.permissionId = permissionId;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) {
        return true;
      }
      if (o == null || getClass() != o.getClass()) {
        return false;
      }
      Pk pk = (Pk) o;
      return Objects.equals(roleId, pk.roleId) && Objects.equals(permissionId, pk.permissionId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(roleId, permissionId);
    }
  }

  @EmbeddedId private Pk id;
}
