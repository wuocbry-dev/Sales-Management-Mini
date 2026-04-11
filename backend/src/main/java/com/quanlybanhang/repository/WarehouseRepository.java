package com.quanlybanhang.repository;

import com.quanlybanhang.model.Warehouse;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

  List<Warehouse> findByStoreIdOrderByWarehouseTypeAscWarehouseCodeAsc(Long storeId);

  List<Warehouse> findByStoreIdIn(Collection<Long> storeIds);

  Optional<Warehouse> findByStoreIdAndWarehouseCode(Long storeId, String warehouseCode);

  Optional<Warehouse> findByStoreIdAndWarehouseType(Long storeId, String warehouseType);

  Optional<Warehouse> findByBranchId(Long branchId);

  boolean existsByStoreIdAndWarehouseCode(Long storeId, String warehouseCode);
}
