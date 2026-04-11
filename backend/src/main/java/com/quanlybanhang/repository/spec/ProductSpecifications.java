package com.quanlybanhang.repository.spec;

import com.quanlybanhang.model.Product;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecifications {

  private ProductSpecifications() {}

  public static Specification<Product> filter(
      String status,
      Long categoryId,
      Long brandId,
      String q,
      Collection<Long> storeIdsScope) {
    return (root, query, cb) -> {
      List<Predicate> p = new ArrayList<>();
      if (storeIdsScope != null) {
        p.add(root.get("storeId").in(storeIdsScope));
      }
      if (status != null && !status.isBlank()) {
        p.add(cb.equal(root.get("status"), status.trim().toUpperCase(Locale.ROOT)));
      }
      if (categoryId != null) {
        p.add(cb.equal(root.get("categoryId"), categoryId));
      }
      if (brandId != null) {
        p.add(cb.equal(root.get("brandId"), brandId));
      }
      if (q != null && !q.isBlank()) {
        String pattern = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
        p.add(
            cb.or(
                cb.like(cb.lower(root.get("productCode")), pattern),
                cb.like(cb.lower(root.get("productName")), pattern)));
      }
      if (p.isEmpty()) {
        return cb.conjunction();
      }
      return cb.and(p.toArray(Predicate[]::new));
    };
  }
}
