package com.quanlybanhang.repository;

import com.quanlybanhang.model.ProductVariant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

  List<ProductVariant> findByProductId(Long productId);

  List<ProductVariant> findByProductIdIn(Collection<Long> productIds);

  @Query(
      "select case when count(v) > 0 then true else false end from ProductVariant v where v.sku = :sku "
          + "and v.productId in (select p.id from Product p where p.storeId = :storeId)")
  boolean existsBySkuAndProductStoreId(@Param("sku") String sku, @Param("storeId") Long storeId);

  @Query(
      "select count(v) from ProductVariant v where v.productId in "
          + "(select p.id from Product p where p.storeId in :storeIds)")
  long countByProductStoreIdIn(@Param("storeIds") Collection<Long> storeIds);

  @Query(
      "select v.id as id, v.sku as sku, v.variantName as variantName, p.productName as productName "
          + "from ProductVariant v join Product p on p.id = v.productId "
          + "where p.storeId = :storeId and "
          + "(lower(v.sku) like lower(concat('%', :q, '%')) "
          + "or lower(coalesce(v.variantName, '')) like lower(concat('%', :q, '%'))) "
          + "order by v.sku asc")
  List<ProductVariantOptionProjection> searchOptionsByStore(
      @Param("storeId") Long storeId, @Param("q") String q, Pageable pageable);
}
