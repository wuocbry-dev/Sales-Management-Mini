package com.quanlybanhang.repository;

import com.quanlybanhang.model.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

  boolean existsByCategoryCode(String categoryCode);

  boolean existsByCategoryCodeAndStoreId(String categoryCode, Long storeId);

  boolean existsByIdAndStoreId(Long id, Long storeId);

  Optional<Category> findByIdAndStoreId(Long id, Long storeId);

  Page<Category> findByStoreId(Long storeId, Pageable pageable);

  Page<Category> findByStoreIdIn(List<Long> storeIds, Pageable pageable);
}
