package com.quanlybanhang.service;

import com.quanlybanhang.dto.InventoryDtos.InventoryAvailabilityResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryLocationAvailability;
import com.quanlybanhang.dto.InventoryDtos.InventoryResponse;
import com.quanlybanhang.dto.InventoryDtos.InventoryTransactionResponse;
import com.quanlybanhang.model.Branch;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.repository.BranchRepository;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.spec.InventoryTransactionSpecifications;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
  private final ProductVariantRepository variantRepository;
  private final WarehouseService warehouseService;
  private final BranchRepository branchRepository;
  private final StoreAccessService storeAccessService;

  public Page<InventoryResponse> listByWarehouse(
      Long warehouseId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    warehouseService.assertCanAccessWarehouse(warehouseId, principal);
    Warehouse w = warehouseService.requireById(warehouseId);
    return mapInventoryPage(
        inventoryRepository.findByWarehouseId(warehouseId, pageable), w.getStoreId());
  }

  public Page<InventoryResponse> listByStore(
      Long storeId, Pageable pageable, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(storeId, principal);
    List<Warehouse> whs = warehouseService.listByStore(storeId, principal);
    List<Long> ids = whs.stream().map(Warehouse::getId).toList();
    if (ids.isEmpty()) {
      return Page.empty(pageable);
    }
    return mapInventoryPage(inventoryRepository.findByWarehouseIdIn(ids, pageable), storeId);
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
    Page<InventoryTransaction> raw = inventoryTransactionRepository.findAll(spec, pageable);
    Set<Long> vids = new HashSet<>();
    for (InventoryTransaction row : raw.getContent()) {
      vids.add(row.getVariantId());
    }
    Map<Long, ProductVariant> vmap = loadVariantsById(vids);
    return raw.map(t -> toTxnResponse(t, vmap.get(t.getVariantId())));
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
    ProductVariant v = variantRepository.findById(variantId).orElse(null);
    String sku = v != null ? v.getSku() : null;
    String vname = v != null ? v.getVariantName() : null;
    return new InventoryAvailabilityResponse(variantId, storeId, sku, vname, locs);
  }

  private Page<InventoryResponse> mapInventoryPage(Page<Inventory> raw, Long fallbackStoreId) {
    Set<Long> vids = new HashSet<>();
    for (Inventory row : raw.getContent()) {
      vids.add(row.getVariantId());
    }
    Map<Long, ProductVariant> vmap = loadVariantsById(vids);
    return raw.map(i -> toInvResponse(i, fallbackStoreId, vmap.get(i.getVariantId())));
  }

  private Map<Long, ProductVariant> loadVariantsById(Set<Long> variantIds) {
    if (variantIds.isEmpty()) {
      return Map.of();
    }
    Map<Long, ProductVariant> out = new HashMap<>();
    for (ProductVariant v : variantRepository.findAllById(variantIds)) {
      out.put(v.getId(), v);
    }
    return out;
  }

  private InventoryResponse toInvResponse(Inventory i, Long storeId, ProductVariant v) {
    Long sid = i.getStoreId() != null ? i.getStoreId() : storeId;
    String sku = v != null ? v.getSku() : null;
    String vname = v != null ? v.getVariantName() : null;
    return new InventoryResponse(
        i.getId(),
        i.getWarehouseId(),
        sid,
        i.getVariantId(),
        sku,
        vname,
        i.getQuantityOnHand(),
        i.getReservedQty(),
        i.getUpdatedAt());
  }

  private InventoryTransactionResponse toTxnResponse(InventoryTransaction t, ProductVariant v) {
    String sku = v != null ? v.getSku() : null;
    String vname = v != null ? v.getVariantName() : null;
    return new InventoryTransactionResponse(
        t.getId(),
        t.getWarehouseId(),
        t.getVariantId(),
        sku,
        vname,
        t.getTransactionType(),
        t.getReferenceType(),
        t.getReferenceId(),
        t.getQtyChange(),
        t.getQtyBefore(),
        t.getQtyAfter(),
        t.getUnitCost(),
        t.getNote(),
        t.getCreatedBy(),
        t.getCreatedAt());
  }
}
