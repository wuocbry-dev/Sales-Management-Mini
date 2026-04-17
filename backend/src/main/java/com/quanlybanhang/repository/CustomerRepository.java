package com.quanlybanhang.repository;

import com.quanlybanhang.model.Customer;
import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

  boolean existsByStoreIdAndCustomerCode(Long storeId, String customerCode);

  boolean existsByStoreIdAndCustomerCodeAndIdNot(Long storeId, String customerCode, Long id);

  boolean existsByIdAndStoreId(Long id, Long storeId);

  Page<Customer> findByStoreId(Long storeId, Pageable pageable);

  Page<Customer> findByStoreIdIn(Collection<Long> storeIds, Pageable pageable);

  long countByStoreIdIn(Collection<Long> storeIds);
}
