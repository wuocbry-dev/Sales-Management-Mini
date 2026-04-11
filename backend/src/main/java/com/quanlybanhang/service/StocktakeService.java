package com.quanlybanhang.service;

import com.quanlybanhang.dto.StocktakeDtos.StocktakeCreateRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeLineRequest;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeLineResponse;
import com.quanlybanhang.dto.StocktakeDtos.StocktakeResponse;
import com.quanlybanhang.exception.BusinessException;
import com.quanlybanhang.exception.ResourceNotFoundException;
import com.quanlybanhang.model.DomainConstants;
import com.quanlybanhang.model.Inventory;
import com.quanlybanhang.model.InventoryTransaction;
import com.quanlybanhang.model.ProductVariant;
import com.quanlybanhang.model.Warehouse;
import com.quanlybanhang.model.Stocktake;
import com.quanlybanhang.model.StocktakeItem;
import com.quanlybanhang.repository.InventoryRepository;
import com.quanlybanhang.repository.InventoryTransactionRepository;
import com.quanlybanhang.repository.ProductVariantRepository;
import com.quanlybanhang.repository.StocktakeRepository;
import com.quanlybanhang.repository.StoreRepository;
import com.quanlybanhang.security.JwtAuthenticatedPrincipal;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StocktakeService {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final StocktakeRepository stocktakeRepository;
  private final InventoryRepository inventoryRepository;
  private final InventoryTransactionRepository inventoryTransactionRepository;
  private final ProductVariantRepository variantRepository;
  private final StoreRepository storeRepository;
  private final StoreAccessService storeAccessService;
  private final WarehouseService warehouseService;

  public StocktakeService(
      StocktakeRepository stocktakeRepository,
      InventoryRepository inventoryRepository,
      InventoryTransactionRepository inventoryTransactionRepository,
      ProductVariantRepository variantRepository,
      StoreRepository storeRepository,
      StoreAccessService storeAccessService,
      WarehouseService warehouseSvc) {
    this.stocktakeRepository = stocktakeRepository;
    this.inventoryRepository = inventoryRepository;
    this.inventoryTransactionRepository = inventoryTransactionRepository;
    this.variantRepository = variantRepository;
    this.storeRepository = storeRepository;
    this.storeAccessService = storeAccessService;
    this.warehouseService = warehouseSvc;
  }

  private LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }

  public Page<StocktakeResponse> list(
      Pageable pageable, Long storeId, String status, JwtAuthenticatedPrincipal principal) {
    List<Long> scope = storeAccessService.dataStoreScopeOrDeny(principal);
    Specification<Stocktake> spec =
        (root, query, cb) -> {
          var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
          if (scope != null) {
            preds.add(root.get("storeId").in(scope));
          }
          if (storeId != null) {
            preds.add(cb.equal(root.get("storeId"), storeId));
            if (scope != null && !scope.contains(storeId)) {
              throw new AccessDeniedException("Không có quyền xem cửa hàng này.");
            }
          }
          if (status != null && !status.isBlank()) {
            preds.add(cb.equal(root.get("status"), status.trim()));
          }
          if (preds.isEmpty()) {
            return cb.conjunction();
          }
          return cb.and(preds.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    return stocktakeRepository.findAll(spec, pageable).map(this::toSummary);
  }

  public StocktakeResponse get(Long id, JwtAuthenticatedPrincipal principal) {
    Stocktake s =
        stocktakeRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu kiểm không tồn tại: " + id));
    storeAccessService.assertCanAccessStore(s.getStoreId(), principal);
    warehouseService.assertCanAccessWarehouse(s.getWarehouseId(), principal);
    return toFull(s);
  }

  @Transactional
  public StocktakeResponse createDraft(
      StocktakeCreateRequest req, long userId, JwtAuthenticatedPrincipal principal) {
    storeAccessService.assertCanAccessStore(req.storeId(), principal);
    if (!storeRepository.existsById(req.storeId())) {
      throw new BusinessException("Cửa hàng không tồn tại: " + req.storeId());
    }
    Warehouse wh = warehouseService.requireById(req.warehouseId());
    if (!wh.getStoreId().equals(req.storeId())) {
      throw new BusinessException("Kho kiểm không thuộc cửa hàng.");
    }
    warehouseService.assertCanAccessWarehouse(req.warehouseId(), principal);
    LocalDateTime t = now();
    Stocktake st = new Stocktake();
    st.setStocktakeCode(nextCode());
    st.setStoreId(req.storeId());
    st.setWarehouseId(req.warehouseId());
    st.setStocktakeDate(req.stocktakeDate());
    st.setStatus(DomainConstants.STOCKTAKE_DRAFT);
    st.setNote(req.note());
    st.setCreatedBy(userId);
    st.setCreatedAt(t);
    st.setUpdatedAt(t);

    for (StocktakeLineRequest line : req.lines()) {
      if (!variantRepository.existsById(line.variantId())) {
        throw new BusinessException("Biến thể không tồn tại: " + line.variantId());
      }
      BigDecimal system =
          inventoryRepository
              .findByWarehouseIdAndVariantId(req.warehouseId(), line.variantId())
              .map(Inventory::getQuantityOnHand)
              .orElse(BigDecimal.ZERO);
      BigDecimal actual = line.actualQty();
      BigDecimal diff = actual.subtract(system).setScale(4, RoundingMode.HALF_UP);
      StocktakeItem item = new StocktakeItem();
      item.setVariantId(line.variantId());
      item.setSystemQty(system);
      item.setActualQty(actual);
      item.setDifferenceQty(diff);
      item.setNote(line.note());
      st.addLine(item);
    }
    stocktakeRepository.save(st);
    return get(st.getId(), principal);
  }

  @Transactional
  public StocktakeResponse confirm(Long id, long userId, JwtAuthenticatedPrincipal principal) {
    Stocktake st =
        stocktakeRepository
            .findWithItemsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Phiếu kiểm không tồn tại: " + id));
    storeAccessService.assertCanAccessStore(st.getStoreId(), principal);
    warehouseService.assertCanAccessWarehouse(st.getWarehouseId(), principal);
    if (!DomainConstants.STOCKTAKE_DRAFT.equals(st.getStatus())) {
      throw new BusinessException("Chỉ xác nhận phiếu kiểm ở trạng thái draft.");
    }
    if (st.getItems().isEmpty()) {
      throw new BusinessException("Phiếu không có dòng chi tiết.");
    }
    LocalDateTime t = now();
    for (StocktakeItem line : st.getItems()) {
      ProductVariant v =
          variantRepository
              .findById(line.getVariantId())
              .orElseThrow(() -> new BusinessException("Biến thể không tồn tại: " + line.getVariantId()));
      Inventory inv =
          inventoryRepository
              .findByWarehouseIdAndVariantId(st.getWarehouseId(), line.getVariantId())
              .orElseGet(
                  () -> {
                    Inventory n = new Inventory();
                    n.setStoreId(st.getStoreId());
                    n.setWarehouseId(st.getWarehouseId());
                    n.setVariantId(line.getVariantId());
                    n.setQuantityOnHand(BigDecimal.ZERO);
                    n.setReservedQty(BigDecimal.ZERO);
                    n.setUpdatedAt(t);
                    return n;
                  });
      if (inv.getStoreId() == null) {
        inv.setStoreId(st.getStoreId());
      }
      BigDecimal before = inv.getQuantityOnHand();
      BigDecimal target = line.getActualQty();
      BigDecimal delta = target.subtract(before);
      inv.setQuantityOnHand(target);
      inv.setUpdatedAt(t);
      inventoryRepository.save(inv);

      InventoryTransaction tx = new InventoryTransaction();
      tx.setWarehouseId(st.getWarehouseId());
      tx.setVariantId(line.getVariantId());
      tx.setTransactionType(DomainConstants.INV_TX_STOCKTAKE_ADJUST);
      tx.setReferenceType(DomainConstants.REF_TYPE_STOCKTAKE);
      tx.setReferenceId(st.getId());
      tx.setQtyChange(delta);
      tx.setQtyBefore(before);
      tx.setQtyAfter(target);
      tx.setUnitCost(v.getCostPrice());
      tx.setNote(line.getNote());
      tx.setCreatedBy(userId);
      tx.setCreatedAt(t);
      inventoryTransactionRepository.save(tx);
    }
    st.setStatus(DomainConstants.STOCKTAKE_COMPLETED);
    st.setApprovedBy(userId);
    st.setUpdatedAt(t);
    stocktakeRepository.save(st);
    return get(id, principal);
  }

  private String nextCode() {
    String d = DateTimeFormatter.BASIC_ISO_DATE.format(java.time.LocalDate.now(ZONE));
    for (int i = 0; i < 8; i++) {
      String c = "KK-" + d + "-" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));
      if (!stocktakeRepository.existsByStocktakeCode(c)) {
        return c;
      }
    }
    throw new BusinessException("Không tạo được mã phiếu kiểm.");
  }

  private StocktakeResponse toSummary(Stocktake s) {
    return new StocktakeResponse(
        s.getId(),
        s.getStocktakeCode(),
        s.getStoreId(),
        s.getWarehouseId(),
        s.getStocktakeDate(),
        s.getStatus(),
        s.getNote(),
        s.getCreatedBy(),
        s.getApprovedBy(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        List.of());
  }

  private StocktakeResponse toFull(Stocktake s) {
    List<StocktakeLineResponse> lines =
        s.getItems().stream()
            .map(
                i ->
                    new StocktakeLineResponse(
                        i.getId(),
                        i.getVariantId(),
                        i.getSystemQty(),
                        i.getActualQty(),
                        i.getDifferenceQty(),
                        i.getNote()))
            .toList();
    return new StocktakeResponse(
        s.getId(),
        s.getStocktakeCode(),
        s.getStoreId(),
        s.getWarehouseId(),
        s.getStocktakeDate(),
        s.getStatus(),
        s.getNote(),
        s.getCreatedBy(),
        s.getApprovedBy(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        lines);
  }
}
