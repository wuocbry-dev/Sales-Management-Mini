package com.quanlybanhang.controller;

import com.quanlybanhang.dto.InventoryDtos.InventoryAvailabilityResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryTransactionResponse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.InventoryQueryService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InventoryController {

  private final InventoryQueryService inventoryQueryService;

  /**
   * Ưu tiên {@code warehouseId}. Nếu chỉ có {@code storeId} — trả tồn gộp theo tất cả kho của store.
   */
  @GetMapping("/inventories")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('INVENTORY_VIEW')")
  public Page<InventoryResponse> listInventories(
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) Long storeId,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    if (warehouseId != null) {
      return inventoryQueryService.listByWarehouse(warehouseId, pageable, principal);
    }
    if (storeId != null) {
      return inventoryQueryService.listByStore(storeId, pageable, principal);
    }
    throw new com.quanlybanhang.exception.BusinessException(
        "Cần warehouseId hoặc storeId (storeId = gộp mọi kho trong cửa hàng).");
  }

  @GetMapping("/inventories/availability")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('INVENTORY_VIEW')")
  public InventoryAvailabilityResponse availability(
      @RequestParam Long storeId,
      @RequestParam Long variantId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return inventoryQueryService.availability(storeId, variantId, principal);
  }

  @GetMapping("/inventory-transactions")
  @PreAuthorize(
      "@authz.systemManage(authentication) or @authz.hasAnyAuthority(authentication, 'INVENTORY_VIEW', 'INVENTORY_TRANSACTION_VIEW')")
  public Page<InventoryTransactionResponse> listTransactions(
      @RequestParam Long warehouseId,
      @RequestParam(required = false) String transactionType,
      @RequestParam(required = false) Long variantId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime fromCreatedAt,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          LocalDateTime toCreatedAt,
      Pageable pageable,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return inventoryQueryService.listTransactions(
        warehouseId, transactionType, variantId, fromCreatedAt, toCreatedAt, pageable, principal);
  }
}
