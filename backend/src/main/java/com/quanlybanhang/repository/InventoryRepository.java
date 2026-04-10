package com.quanlybanhang.repository;

import com.quanlybanhang.model.Inventory;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

  Optional<Inventory> findByStoreIdAndVariantId(Long storeId, Long variantId);

  Page<Inventory> findByStoreId(Long storeId, Pageable pageable);
}
