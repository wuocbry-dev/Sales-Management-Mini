package com.quanlybanhang.repository;

import com.quanlybanhang.model.StockTransfer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockTransferRepository
    extends JpaRepository<StockTransfer, Long>, JpaSpecificationExecutor<StockTransfer> {

  boolean existsByTransferCode(String transferCode);

  @Query(
      "select distinct t from StockTransfer t left join fetch t.items where t.id = :id")
  Optional<StockTransfer> findWithItemsById(@Param("id") Long id);
}
