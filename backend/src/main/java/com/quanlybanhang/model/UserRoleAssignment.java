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

@Entity
@Table(name = "user_roles")
@Getter
@Setter
@NoArgsConstructor
public class UserRoleAssignment {

  @Embeddable
  @Getter
  @Setter
  @NoArgsConstructor
  public static class Pk implements Serializable {
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "role_id", nullable = false)
    private Long roleId;

    public Pk(Long userId, Long roleId) {
      this.userId = userId;
      this.roleId = roleId;
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
      return Objects.equals(userId, pk.userId) && Objects.equals(roleId, pk.roleId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, roleId);
    }
  }

  @EmbeddedId private Pk id;
}
