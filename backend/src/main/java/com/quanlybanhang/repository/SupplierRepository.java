package com.quanlybanhang.repository;

import com.quanlybanhang.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

  boolean existsBySupplierCode(String supplierCode);
}
