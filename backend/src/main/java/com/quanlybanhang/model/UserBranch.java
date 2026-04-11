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
@Table(name = "user_branches")
@Getter
@Setter
@NoArgsConstructor
public class UserBranch {

  @Embeddable
  @Getter
  @Setter
  @NoArgsConstructor
  public static class Pk implements Serializable {
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    public Pk(Long userId, Long branchId) {
      this.userId = userId;
      this.branchId = branchId;
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
      return Objects.equals(userId, pk.userId) && Objects.equals(branchId, pk.branchId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, branchId);
    }
  }

  @EmbeddedId private Pk id;

  @Column(name = "is_primary", nullable = false)
  private boolean isPrimary;
}
