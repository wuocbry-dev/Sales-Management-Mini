package com.quanlybanhang.repository;

import com.quanlybanhang.model.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryTransactionRepository
    extends JpaRepository<InventoryTransaction, Long>,
        JpaSpecificationExecutor<InventoryTransaction> {

  Page<InventoryTransaction> findByStoreId(Long storeId, Pageable pageable);
}
