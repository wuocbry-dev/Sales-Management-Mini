package com.quanlybanhang.repository;

import com.quanlybanhang.model.Product;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository
    extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

  boolean existsByProductCodeAndStoreId(String productCode, Long storeId);

  long countByStoreIdIn(Collection<Long> storeIds);

  @Query(
      "select p.storeId from Product p inner join ProductVariant v on v.productId = p.id where v.id = :variantId")
  Optional<Long> findStoreIdByVariantId(@Param("variantId") Long variantId);
}
