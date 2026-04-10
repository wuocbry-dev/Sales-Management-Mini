package com.quanlybanhang.repository.spec;

import com.quanlybanhang.model.GoodsReceipt;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public final class GoodsReceiptSpecifications {

  private GoodsReceiptSpecifications() {}

  public static Specification<GoodsReceipt> filter(
      Long storeId, String status, LocalDateTime fromDate, LocalDateTime toDate) {
    return (root, query, cb) -> {
      List<Predicate> p = new ArrayList<>();
      if (storeId != null) {
        p.add(cb.equal(root.get("storeId"), storeId));
      }
      if (status != null && !status.isBlank()) {
        p.add(cb.equal(root.get("status"), status.trim()));
      }
      if (fromDate != null) {
        p.add(cb.greaterThanOrEqualTo(root.get("receiptDate"), fromDate));
      }
      if (toDate != null) {
        p.add(cb.lessThanOrEqualTo(root.get("receiptDate"), toDate));
      }
      if (p.isEmpty()) {
        return cb.conjunction();
      }
      return cb.and(p.toArray(Predicate[]::new));
    };
  }
}
