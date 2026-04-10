package com.quanlybanhang.repository.spec;

import com.quanlybanhang.model.InventoryTransaction;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class InventoryTransactionSpecifications {

  private InventoryTransactionSpecifications() {}

  public static Specification<InventoryTransaction> filter(
      Long storeId,
      String transactionType,
      Long variantId,
      LocalDateTime fromCreatedAt,
      LocalDateTime toCreatedAt) {
    return (root, query, cb) -> {
      List<Predicate> p = new ArrayList<>();
      p.add(cb.equal(root.get("storeId"), storeId));
      if (transactionType != null && !transactionType.isBlank()) {
        p.add(cb.equal(root.get("transactionType"), transactionType.trim()));
      }
      if (variantId != null) {
        p.add(cb.equal(root.get("variantId"), variantId));
      }
      if (fromCreatedAt != null) {
        p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromCreatedAt));
      }
      if (toCreatedAt != null) {
        p.add(cb.lessThanOrEqualTo(root.get("createdAt"), toCreatedAt));
      }
      return cb.and(p.toArray(Predicate[]::new));
    };
  }
}
