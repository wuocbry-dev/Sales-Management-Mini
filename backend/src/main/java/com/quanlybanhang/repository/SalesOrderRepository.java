package com.quanlybanhang.repository;

import com.quanlybanhang.model.SalesOrder;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

  boolean existsByOrderCode(String orderCode);

  @Query(
      "select distinct o from SalesOrder o left join fetch o.items where o.id = :id")
  Optional<SalesOrder> findWithItemsById(@Param("id") Long id);
}
