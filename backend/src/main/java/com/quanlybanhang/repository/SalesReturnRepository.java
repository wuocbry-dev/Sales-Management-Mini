package com.quanlybanhang.repository;

import com.quanlybanhang.model.SalesReturn;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesReturnRepository
    extends JpaRepository<SalesReturn, Long>, JpaSpecificationExecutor<SalesReturn> {

  boolean existsByReturnCode(String returnCode);

  @Query(
      "select distinct r from SalesReturn r left join fetch r.items where r.id = :id")
  Optional<SalesReturn> findWithItemsById(@Param("id") Long id);

  @Query(
      "select coalesce(sum(i.quantity),0) from SalesReturnItem i join i.salesReturn r "
          + "where r.orderId = :orderId and i.orderItemId = :orderItemId and r.status = :status")
  BigDecimal sumReturnedForLine(
      @Param("orderId") Long orderId,
      @Param("orderItemId") Long orderItemId,
      @Param("status") String status);

  @Query("select count(r) from SalesReturn r where r.storeId in :storeIds")
  long countReturnsForStoreIds(@Param("storeIds") Collection<Long> storeIds);
}
