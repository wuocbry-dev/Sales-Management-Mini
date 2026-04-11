package com.quanlybanhang.repository;

import com.quanlybanhang.model.Store;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {

  boolean existsByStoreCode(String storeCode);

  Page<Store> findByIdIn(Collection<Long> ids, Pageable pageable);
}
