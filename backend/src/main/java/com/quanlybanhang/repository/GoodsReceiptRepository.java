package com.quanlybanhang.repository;

import com.quanlybanhang.model.GoodsReceipt;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GoodsReceiptRepository
    extends JpaRepository<GoodsReceipt, Long>, JpaSpecificationExecutor<GoodsReceipt> {

  boolean existsByReceiptCode(String receiptCode);

  boolean existsBySupplierIdAndStoreId(Long supplierId, Long storeId);

  @Query(
      "select distinct r from GoodsReceipt r left join fetch r.items where r.id = :id")
  Optional<GoodsReceipt> findWithItemsById(@Param("id") Long id);

  @Query(
      "select coalesce(sum(r.totalAmount), 0) from GoodsReceipt r "
          + "where lower(r.status) in :statuses and r.receiptDate >= :fromDate and r.receiptDate < :toDate")
  BigDecimal sumTotalAmountByStatusInAndReceiptDateRange(
      @Param("statuses") Collection<String> statuses,
      @Param("fromDate") LocalDateTime fromDate,
      @Param("toDate") LocalDateTime toDate);

  @Query(
      "select coalesce(sum(r.totalAmount), 0) from GoodsReceipt r "
          + "where lower(r.status) in :statuses and r.storeId in :storeIds "
          + "and r.receiptDate >= :fromDate and r.receiptDate < :toDate")
  BigDecimal sumTotalAmountByStatusInAndStoreIdInAndReceiptDateRange(
      @Param("statuses") Collection<String> statuses,
      @Param("storeIds") Collection<Long> storeIds,
      @Param("fromDate") LocalDateTime fromDate,
      @Param("toDate") LocalDateTime toDate);
}
