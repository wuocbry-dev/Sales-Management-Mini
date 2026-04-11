package com.quanlybanhang.repository;

import com.quanlybanhang.model.Inventory;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

  Optional<Inventory> findByWarehouseIdAndVariantId(Long warehouseId, Long variantId);

  Page<Inventory> findByWarehouseId(Long warehouseId, Pageable pageable);

  Page<Inventory> findByWarehouseIdIn(Collection<Long> warehouseIds, Pageable pageable);

  List<Inventory> findByWarehouseIdInAndVariantId(Collection<Long> warehouseIds, Long variantId);

  @Query(
      "select count(i) from Inventory i join ProductVariant v on v.id = i.variantId "
          + "where i.quantityOnHand < v.reorderLevel")
  long countLowStock();

  @Query(
      "select count(i) from Inventory i join ProductVariant v on v.id = i.variantId "
          + "join Warehouse w on w.id = i.warehouseId where i.quantityOnHand < v.reorderLevel "
          + "and w.storeId in :storeIds")
  long countLowStockByStoreIdIn(@Param("storeIds") Collection<Long> storeIds);
}
