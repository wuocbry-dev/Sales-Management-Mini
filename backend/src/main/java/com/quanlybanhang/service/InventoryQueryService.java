package com.quanlybanhang.service;

import com.quanlybanhang.dto.InventoryDtos.InventoryAvailabilityResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryLocationAvailability;
import com.quanlybanhang.dto.InventoryDtos.InventoryResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryTransactionResponse;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.spec.InventoryTransactionSpecifications;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryQueryService {

  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final WarehouseService warehouseService;
  private final BranchRepository branchRepository;
  private final StoreAccessService storeAccessService;

  public Page<InventoryResponse> listByWarehouse(
      Long warehouseId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    warehouseService.assertCanAccessWarehouse(warehouseId, principal);
    Warehouse w = warehouseService.requireById(warehouseId);
    return inventoryRepository
        .findByWarehouseId(warehouseId, pageable)
        .map(i -> toInvResponse(i, w.getStoreId()));
  }

  public Page<InventoryResponse> listByStore(
      Long storeId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    List<Warehouse> whs = warehouseService.listByStore(storeId, principal);
    List<Long> ids = whs.stream().map(Warehouse::getId).toList();
    if (ids.isEmpty()) {
      return Page.empty(pageable);
    }
    return inventoryRepository.findByWarehouseIdIn(ids, pageable).map(i -> toInvResponse(i, storeId));
  }

  public Page<InventoryTransactionResponse> listTransactions(
      Long warehouseId,
      String transactionType,
      Long variantId,
      LocalDateTime fromCreatedAt,
      LocalDateTime toCreatedAt,
      Pageable pageable,
      JwtAuthenticatedPrincipal principal) {
    warehouseService.assertCanAccessWarehouse(warehouseId, principal);
    Specification<InventoryTransaction> spec =
        InventoryTransactionSpecifications.filter(
            warehouseId, transactionType, variantId, fromCreatedAt, toCreatedAt);
    return inventoryTransactionRepository
        .findAll(spec, pageable)
        .map(
            t ->
                new InventoryTransactionResponse(
                    t.getId(),
                    t.getWarehouseId(),
                    t.getVariantId(),
                    t.getTransactionType(),
                    t.getReferenceType(),
                    t.getReferenceId(),
                    t.getQtyChange(),
                    t.getQtyBefore(),
                    t.getQtyAfter(),
                    t.getUnitCost(),
                    t.getNote(),
                    t.getCreatedBy(),
                    t.getCreatedAt()));
  }

  /** Tồn variant theo từng kho trong một store (kho tổng + các chi nhánh). */
  public InventoryAvailabilityResponse availability(
      Long storeId, Long variantId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    List<Warehouse> whs = warehouseService.listByStore(storeId, principal);
    List<Long> whIds = whs.stream().map(Warehouse::getId).toList();
    List<Inventory> rows = inventoryRepository.findByWarehouseIdInAndVariantId(whIds, variantId);
    var byWh = new java.util.HashMap<Long, Inventory>();
    for (Inventory r : rows) {
      byWh.put(r.getWarehouseId(), r);
    }
    List<InventoryLocationAvailability> locs = new ArrayList<>();
    for (Warehouse w : whs) {
      Inventory inv = byWh.get(w.getId());
      var qty = inv != null ? inv.getQuantityOnHand() : java.math.BigDecimal.ZERO;
      String bname = null;
      if (w.getBranchId() != null) {
        bname =
            branchRepository
                .findById(w.getBranchId())
                .map(Branch::getBranchName)
                .orElse(null);
      }
      locs.add(
          new InventoryLocationAvailability(
              w.getId(),
              w.getWarehouseName(),
              w.getWarehouseType(),
              w.getBranchId(),
              bname,
              qty));
    }
    return new InventoryAvailabilityResponse(variantId, storeId, locs);
  }

  private InventoryResponse toInvResponse(Inventory i, Long storeId) {
    return new InventoryResponse(
        i.getId(),
        i.getWarehouseId(),
        storeId,
        i.getVariantId(),
        i.getQuantityOnHand(),
        i.getReservedQty(),
        i.getUpdatedAt());
  }
}
