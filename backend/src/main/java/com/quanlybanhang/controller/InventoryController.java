package com.quanlybanhang.controller;

import com.quanlybanhang.dto.InventoryDtos.InventoryResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryTransactionResponse;
import com.quanlybanhang.service.InventoryQueryService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryController {

  private final InventoryQueryService inventoryQueryService;

  @GetMapping("/inventories")
  public Page<InventoryResponse> listInventories(
      @RequestParam Long storeId, Pageable pageable) {
    return inventoryQueryService.listByStore(storeId, pageable);
  }

  @GetMapping("/inventory-transactions")
  public Page<InventoryTransactionResponse> listTransactions(
      @RequestParam Long storeId,
      @RequestParam(required = false) String transactionType,
      @RequestParam(required = false) Long variantId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime fromCreatedAt,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime toCreatedAt,
      Pageable pageable) {
    return inventoryQueryService.listTransactions(
        storeId, transactionType, variantId, fromCreatedAt, toCreatedAt, pageable);
  }
}
