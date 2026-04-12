package com.quanlybanhang.repository;

import com.quanlybanhang.model.ProductImage;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

  List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

  List<ProductImage> findByProductIdInOrderByProductIdAscSortOrderAscIdAsc(Collection<Long> productIds);

  void deleteByProductId(Long productId);
}
