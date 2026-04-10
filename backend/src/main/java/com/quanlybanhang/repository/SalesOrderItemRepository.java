package com.quanlybanhang.repository;

import com.quanlybanhang.model.SalesOrderItem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, Long> {

  Optional<SalesOrderItem> findByIdAndSalesOrder_Id(Long id, Long orderId);
}
