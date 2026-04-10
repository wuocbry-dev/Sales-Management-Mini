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

/** Bảng gán user–store (`user_stores`). */
@Entity
@Table(name = "user_stores")
@Getter
@Setter
@NoArgsConstructor
public class UserStore {

  @Embeddable
  @Getter
  @Setter
  @NoArgsConstructor
  public static class Pk implements Serializable {
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    public Pk(Long userId, Long storeId) {
      this.userId = userId;
      this.storeId = storeId;
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
      return Objects.equals(userId, pk.userId) && Objects.equals(storeId, pk.storeId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, storeId);
    }
  }

  @EmbeddedId private Pk id;

  @Column(name = "is_primary", nullable = false)
  private boolean isPrimary;
}
