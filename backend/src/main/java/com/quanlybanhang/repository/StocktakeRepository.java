package com.quanlybanhang.repository;

import com.quanlybanhang.model.Stocktake;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StocktakeRepository
    extends JpaRepository<Stocktake, Long>, JpaSpecificationExecutor<Stocktake> {

  boolean existsByStocktakeCode(String stocktakeCode);

  @Query(
      "select distinct s from Stocktake s left join fetch s.items where s.id = :id")
  Optional<Stocktake> findWithItemsById(@Param("id") Long id);
}
