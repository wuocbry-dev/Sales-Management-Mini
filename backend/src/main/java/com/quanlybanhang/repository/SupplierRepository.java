package com.quanlybanhang.repository;

import com.quanlybanhang.model.Supplier;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

  boolean existsBySupplierCode(String supplierCode);

  boolean existsBySupplierCodeAndStoreId(String supplierCode, Long storeId);

  boolean existsByIdAndStoreId(Long id, Long storeId);

  Page<Supplier> findByStoreId(Long storeId, Pageable pageable);

  Page<Supplier> findByStoreIdIn(List<Long> storeIds, Pageable pageable);
}
