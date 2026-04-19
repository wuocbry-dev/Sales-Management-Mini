package com.quanlybanhang.repository;

import com.quanlybanhang.model.Brand;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {

  boolean existsByBrandCode(String brandCode);

  boolean existsByBrandCodeAndStoreId(String brandCode, Long storeId);

  boolean existsByIdAndStoreId(Long id, Long storeId);

  Page<Brand> findByStatus(String status, Pageable pageable);

  Page<Brand> findByStoreIdAndStatus(Long storeId, String status, Pageable pageable);

  Page<Brand> findByStoreIdInAndStatus(List<Long> storeIds, String status, Pageable pageable);

  Page<Brand> findByStoreId(Long storeId, Pageable pageable);

  Page<Brand> findByStoreIdIn(List<Long> storeIds, Pageable pageable);
}
