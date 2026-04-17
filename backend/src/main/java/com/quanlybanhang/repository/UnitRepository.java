package com.quanlybanhang.repository;

import com.quanlybanhang.model.Unit;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, Long> {

  boolean existsByUnitCode(String unitCode);

  boolean existsByUnitCodeAndStoreId(String unitCode, Long storeId);

  boolean existsByIdAndStoreId(Long id, Long storeId);

  Page<Unit> findByStoreId(Long storeId, Pageable pageable);

  Page<Unit> findByStoreIdIn(List<Long> storeIds, Pageable pageable);
}
