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
      "select case when count(v) > 0 then true else false end from ProductVariant v "
          + "where v.storeId = :storeId and v.sku = :sku")
  boolean existsBySkuAndProductStoreId(@Param("sku") String sku, @Param("storeId") Long storeId);

  @Query(
      "select count(v) from ProductVariant v where v.storeId in :storeIds")
  long countByProductStoreIdIn(@Param("storeIds") Collection<Long> storeIds);

  @Query(
      "select v.id as id, v.sku as sku, v.variantName as variantName, p.productName as productName, "
          + "v.sellingPrice as sellingPrice "
          + "from ProductVariant v join Product p on p.id = v.productId "
          + "where v.storeId = :storeId and "
          + "(lower(v.sku) like lower(concat('%', :q, '%')) "
          + "or lower(coalesce(v.variantName, '')) like lower(concat('%', :q, '%'))) "
          + "order by v.sku asc")
  List<ProductVariantOptionProjection> searchOptionsByStore(
      @Param("storeId") Long storeId, @Param("q") String q, Pageable pageable);

  @Query(
      "select case when count(v) > 0 then true else false end from ProductVariant v "
          + "where v.storeId = :storeId and v.sku = :sku "
          + "and v.id <> :excludeId")
  boolean existsBySkuInStoreExcludingVariant(
      @Param("sku") String sku, @Param("storeId") Long storeId, @Param("excludeId") Long excludeId);

  @Query(
      "select case when count(v) > 0 then true else false end from ProductVariant v "
          + "where v.storeId = :storeId and v.barcode = :barcode")
  boolean existsByBarcodeAndStoreId(@Param("barcode") String barcode, @Param("storeId") Long storeId);

  @Query(
      "select case when count(v) > 0 then true else false end from ProductVariant v "
          + "where v.storeId = :storeId and v.barcode = :barcode and v.id <> :excludeId")
  boolean existsByBarcodeInStoreExcludingVariant(
      @Param("barcode") String barcode,
      @Param("storeId") Long storeId,
      @Param("excludeId") Long excludeId);

  @Query(
      value =
          "SELECT COALESCE((SELECT COUNT(*) FROM sales_order_items WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM goods_receipt_items WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM sales_return_items WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM stock_transfer_items WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM stocktake_items WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM inventory_transactions WHERE variant_id = :vid), 0)"
              + " + COALESCE((SELECT COUNT(*) FROM inventories WHERE variant_id = :vid), 0)",
      nativeQuery = true)
  long countReferencesByVariantId(@Param("vid") long vid);
}
