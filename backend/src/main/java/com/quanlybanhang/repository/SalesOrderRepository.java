package com.quanlybanhang.repository;

import com.quanlybanhang.model.SalesOrder;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {

  boolean existsByOrderCode(String orderCode);

  @Query(
      "select distinct o from SalesOrder o left join fetch o.items where o.id = :id")
  Optional<SalesOrder> findWithItemsById(@Param("id") Long id);

  @Query(
      "select distinct o from SalesOrder o left join fetch o.items "
          + "where o.storeId = :storeId and o.orderCode = :orderCode")
  Optional<SalesOrder> findWithItemsByStoreIdAndOrderCode(
      @Param("storeId") Long storeId, @Param("orderCode") String orderCode);

  @Query("select coalesce(sum(o.totalAmount), 0) from SalesOrder o where o.status = :status")
  BigDecimal sumTotalAmountByStatus(@Param("status") String status);

  @Query(
      "select coalesce(sum(o.totalAmount), 0) from SalesOrder o "
          + "where o.status = :status and o.orderDate >= :fromDate and o.orderDate < :toDate")
  BigDecimal sumTotalAmountByStatusAndOrderDateRange(
      @Param("status") String status,
      @Param("fromDate") LocalDateTime fromDate,
      @Param("toDate") LocalDateTime toDate);

  long countByStatus(String status);

  @Query(
      "select o.storeId, coalesce(sum(o.totalAmount), 0), count(o) from SalesOrder o "
          + "where o.status = :status group by o.storeId")
  List<Object[]> aggregateCompletedByStore(@Param("status") String status);

  Page<SalesOrder> findByStoreIdIn(Collection<Long> storeIds, Pageable pageable);

  @Query(
      "select coalesce(sum(o.totalAmount), 0) from SalesOrder o where o.status = :status and o.storeId in :storeIds")
  BigDecimal sumTotalAmountByStatusAndStoreIdIn(
      @Param("status") String status, @Param("storeIds") Collection<Long> storeIds);

  @Query(
      "select coalesce(sum(o.totalAmount), 0) from SalesOrder o "
          + "where o.status = :status and o.storeId in :storeIds "
          + "and o.orderDate >= :fromDate and o.orderDate < :toDate")
  BigDecimal sumTotalAmountByStatusAndStoreIdInAndOrderDateRange(
      @Param("status") String status,
      @Param("storeIds") Collection<Long> storeIds,
      @Param("fromDate") LocalDateTime fromDate,
      @Param("toDate") LocalDateTime toDate);

  @Query("select count(o) from SalesOrder o where o.status = :status and o.storeId in :storeIds")
  long countByStatusAndStoreIdIn(
      @Param("status") String status, @Param("storeIds") Collection<Long> storeIds);

  @Query("select count(o) from SalesOrder o where o.storeId in :storeIds")
  long countByStoreIdIn(@Param("storeIds") Collection<Long> storeIds);

  @Query(
      "select o.storeId, coalesce(sum(o.totalAmount), 0), count(o) from SalesOrder o "
          + "where o.status = :status and o.storeId in :storeIds group by o.storeId")
  List<Object[]> aggregateCompletedByStoreAndStoreIdIn(
      @Param("status") String status, @Param("storeIds") Collection<Long> storeIds);
}
