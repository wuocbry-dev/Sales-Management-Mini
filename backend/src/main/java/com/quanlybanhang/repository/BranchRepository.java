package com.quanlybanhang.repository;

import com.quanlybanhang.model.Branch;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, Long> {

  boolean existsByStoreIdAndBranchCode(Long storeId, String branchCode);

  Page<Branch> findByStoreId(Long storeId, Pageable pageable);

  Page<Branch> findByStoreIdAndIdIn(Long storeId, Collection<Long> branchIds, Pageable pageable);
}
