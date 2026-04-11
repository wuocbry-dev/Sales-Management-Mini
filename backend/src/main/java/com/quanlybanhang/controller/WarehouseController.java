package com.quanlybanhang.controller;

import com.quanlybanhang.dto.WarehouseDtos.WarehouseResponse;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import com.quanlybanhang.service.WarehouseService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WarehouseController {

  private final WarehouseService warehouseService;

  @GetMapping("/stores/{storeId}/warehouses")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('INVENTORY_VIEW')")
  public List<WarehouseResponse> listForStore(
      @PathVariable Long storeId, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return warehouseService.listByStore(storeId, principal).stream()
        .map(WarehouseController::toResp)
        .toList();
  }

  /** Alias: ?storeId= bắt buộc — cùng dữ liệu với /api/stores/{storeId}/warehouses */
  @GetMapping("/warehouses")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('INVENTORY_VIEW')")
  public List<WarehouseResponse> listQuery(
      @RequestParam Long storeId, @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    return listForStore(storeId, principal);
  }

  @GetMapping("/stores/{storeId}/warehouses/{warehouseId}")
  @PreAuthorize("@authz.systemManage(authentication) or hasAuthority('INVENTORY_VIEW')")
  public WarehouseResponse get(
      @PathVariable Long storeId,
      @PathVariable Long warehouseId,
      @AuthenticationPrincipal JwtAuthenticatedPrincipal principal) {
    warehouseService.assertCanAccessWarehouse(warehouseId, principal);
    Warehouse w = warehouseService.requireById(warehouseId);
    if (!w.getStoreId().equals(storeId)) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.NOT_FOUND, "Kho không thuộc cửa hàng.");
    }
    return toResp(w);
  }

  private static WarehouseResponse toResp(Warehouse w) {
    return new WarehouseResponse(
        w.getId(),
        w.getStoreId(),
        w.getBranchId(),
        w.getWarehouseCode(),
        w.getWarehouseName(),
        w.getWarehouseType(),
        w.getStatus());
  }
}
