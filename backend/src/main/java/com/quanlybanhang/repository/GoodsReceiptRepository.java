package com.quanlybanhang.repository;

import com.quanlybanhang.model.GoodsReceipt;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GoodsReceiptRepository
    extends JpaRepository<GoodsReceipt, Long>, JpaSpecificationExecutor<GoodsReceipt> {

  boolean existsByReceiptCode(String receiptCode);

  @Query(
      "select distinct r from GoodsReceipt r left join fetch r.items where r.id = :id")
  Optional<GoodsReceipt> findWithItemsById(@Param("id") Long id);
}
