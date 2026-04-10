package com.quanlybanhang.repository;

import com.quanlybanhang.model.ProductVariant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

  List<ProductVariant> findByProductId(Long productId);

  List<ProductVariant> findByProductIdIn(Collection<Long> productIds);

  boolean existsBySku(String sku);
}
